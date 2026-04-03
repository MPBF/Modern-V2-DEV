import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { db } from "../db";
import { mobile_sessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      name: string;
      role: string;
      role_id: number;
      department?: string | null;
      status: string;
      permissions?: string[];
    };
  }
}

const mobileTokens = new Map<string, { userId: number; createdAt: number }>();

const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const ROLES_CACHE_TTL_MS = 60 * 1000;
let rolesCache: { data: any[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

export async function getCachedRoles() {
  const now = Date.now();
  if (rolesCache.data && now - rolesCache.fetchedAt < ROLES_CACHE_TTL_MS) {
    return rolesCache.data;
  }
  const roles = await storage.getRoles();
  rolesCache = { data: roles, fetchedAt: now };
  return roles;
}

export function invalidateRolesCache() {
  rolesCache = { data: null, fetchedAt: 0 };
}

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, entry] of Array.from(mobileTokens.entries())) {
    if (now - entry.createdAt > TOKEN_EXPIRY_MS) {
      mobileTokens.delete(token);
    }
  }
}

setInterval(cleanupExpiredTokens, TOKEN_CLEANUP_INTERVAL_MS);

export function generateMobileToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  mobileTokens.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function revokeMobileToken(token: string): void {
  mobileTokens.delete(token);
}

const ACCESS_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMobileSession(userId: number, deviceInfo: {
  device_id?: string;
  device_name?: string;
  platform?: string;
  app_version?: string;
  ip_address?: string;
}): Promise<{ token: string; refresh_token: string; expires_at: Date; refresh_expires_at: Date }> {
  const token = crypto.randomBytes(48).toString("hex");
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS);
  const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_MS);

  await db.insert(mobile_sessions).values({
    user_id: userId,
    token: hashToken(token),
    refresh_token: hashToken(refreshToken),
    device_id: deviceInfo.device_id || null,
    device_name: deviceInfo.device_name || null,
    platform: deviceInfo.platform || null,
    app_version: deviceInfo.app_version || null,
    ip_address: deviceInfo.ip_address || null,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
    is_active: true,
  });

  return { token, refresh_token: refreshToken, expires_at: expiresAt, refresh_expires_at: refreshExpiresAt };
}

export async function refreshMobileSession(refreshToken: string): Promise<{ token: string; refresh_token: string; expires_at: Date; refresh_expires_at: Date } | null> {
  const hashedRefresh = hashToken(refreshToken);
  const [session] = await db.select().from(mobile_sessions)
    .where(and(
      eq(mobile_sessions.refresh_token, hashedRefresh),
      eq(mobile_sessions.is_active, true),
      gt(mobile_sessions.refresh_expires_at, new Date())
    )).limit(1);

  if (!session) return null;

  await db.update(mobile_sessions)
    .set({ is_active: false })
    .where(eq(mobile_sessions.id, session.id));

  return createMobileSession(session.user_id, {
    device_id: session.device_id || undefined,
    device_name: session.device_name || undefined,
    platform: session.platform || undefined,
    app_version: session.app_version || undefined,
    ip_address: session.ip_address || undefined,
  });
}

export async function revokeMobileSession(token: string): Promise<void> {
  const hashedToken = hashToken(token);
  await db.update(mobile_sessions)
    .set({ is_active: false })
    .where(eq(mobile_sessions.token, hashedToken));
}

async function getUserIdFromDbToken(token: string): Promise<number | null> {
  const hashedToken = hashToken(token);
  const [session] = await db.select().from(mobile_sessions)
    .where(and(
      eq(mobile_sessions.token, hashedToken),
      eq(mobile_sessions.is_active, true),
      gt(mobile_sessions.expires_at, new Date())
    )).limit(1);

  if (!session) return null;

  await db.update(mobile_sessions)
    .set({ last_active_at: new Date() })
    .where(eq(mobile_sessions.id, session.id));

  return session.user_id;
}

function getUserIdFromToken(token: string): number | null {
  const entry = mobileTokens.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TOKEN_EXPIRY_MS) {
    mobileTokens.delete(token);
    return null;
  }
  return entry.userId;
}

export async function populateUserFromSession(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    const inMemoryUserId = getUserIdFromToken(token);
    if (inMemoryUserId) {
      try {
        const user = await resolveUserById(inMemoryUserId);
        if (user) req.user = user;
      } catch (e) {
        console.error("Error resolving user from in-memory token:", e);
      }
      return next();
    }

    try {
      const dbUserId = await getUserIdFromDbToken(token);
      if (dbUserId) {
        const user = await resolveUserById(dbUserId);
        if (user) req.user = user;
        return next();
      }
    } catch (e) {
      console.error("Error resolving user from DB token:", e);
    }

    return next();
  }

  if (!req.session?.userId) {
    return next();
  }

  try {
    const resolvedUser = await resolveUserById(req.session.userId);
    
    if (!resolvedUser) {
      if (req.session?.destroy) {
        req.session.destroy((err) => {
          if (err) console.error("Error destroying invalid session:", err);
        });
      }
      return next();
    }

    req.user = resolvedUser;
    next();
  } catch (error) {
    console.error("Error populating user from session:", error);
    next();
  }
}

async function resolveUserById(userId: number) {
  const user = await storage.getUserById(userId);
  if (!user || user.status !== "active") return null;

  let permissions: string[] = [];
  let roleName = "user";

  if (user.role_id) {
    const roles = await getCachedRoles();
    const userRole = roles.find(r => r.id === user.role_id);

    if (userRole) {
      roleName = userRole.name || "user";
      if (userRole.permissions) {
        try {
          if (Array.isArray(userRole.permissions)) {
            permissions = userRole.permissions;
          } else if (typeof userRole.permissions === 'string') {
            const parsed = JSON.parse(userRole.permissions);
            permissions = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
          if (typeof userRole.permissions === 'string' && (userRole.permissions as string).trim()) {
            permissions = [(userRole.permissions as string).trim()];
          } else {
            permissions = [];
          }
        }
      }
    }
  }

  if (roleName.toLowerCase() === 'admin' && !permissions.includes('admin')) {
    permissions.push('admin');
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.display_name || user.username || "",
    role: roleName,
    role_id: user.role_id || 0,
    department: user.section_id ? String(user.section_id) : null,
    status: user.status || "active",
    permissions
  };
}