import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Single key for the token bundle so writes are atomic. Avoids the race where
// the access token is updated but the refresh token write is interrupted.
const TOKENS_KEY = "mpbf.auth.tokens.v2";
const USER_KEY = "mpbf.auth.user";

// Legacy keys (v1) — read once for migration, then deleted.
const LEGACY_TOKEN_KEY = "mpbf.auth.token";
const LEGACY_REFRESH_KEY = "mpbf.auth.refresh";

interface TokenBundle {
  token: string;
  refreshToken: string;
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key).catch(() => {});
}

async function loadBundle(): Promise<TokenBundle | null> {
  const raw = await getItem(TOKENS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.token && parsed?.refreshToken) return parsed as TokenBundle;
    } catch {
      // fall through to legacy migration
    }
  }
  // Migrate from v1 split keys if present.
  const legacyToken = await getItem(LEGACY_TOKEN_KEY);
  const legacyRefresh = await getItem(LEGACY_REFRESH_KEY);
  if (legacyToken && legacyRefresh) {
    const bundle: TokenBundle = { token: legacyToken, refreshToken: legacyRefresh };
    await setItem(TOKENS_KEY, JSON.stringify(bundle));
    await deleteItem(LEGACY_TOKEN_KEY);
    await deleteItem(LEGACY_REFRESH_KEY);
    return bundle;
  }
  return null;
}

export const AuthStorage = {
  async setTokens(token: string, refreshToken: string) {
    await setItem(TOKENS_KEY, JSON.stringify({ token, refreshToken }));
  },
  async getToken() {
    const b = await loadBundle();
    return b?.token ?? null;
  },
  async getRefreshToken() {
    const b = await loadBundle();
    return b?.refreshToken ?? null;
  },
  async setUser(user: unknown) {
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async clear() {
    await deleteItem(TOKENS_KEY);
    await deleteItem(USER_KEY);
    await deleteItem(LEGACY_TOKEN_KEY);
    await deleteItem(LEGACY_REFRESH_KEY);
  },
};
