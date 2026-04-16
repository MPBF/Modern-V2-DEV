import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { api } from "@/api/client";
import { AuthStorage } from "@/auth/storage";
import { authForcedLogout } from "@/auth/events";
import { Endpoints, type MobileLoginRequest, type MobileLoginResponse, type User } from "@mpbf/shared";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AuthStorage.getUser<User>();
        const token = await AuthStorage.getToken();
        if (storedUser && token) setUser(storedUser);
      } finally {
        setIsLoading(false);
      }
    })();
    // If the API client gives up on refreshing, drop to logged-out state
    // immediately so the route guard sends the user back to /login.
    return authForcedLogout.on(() => setUser(null));
  }, []);

  const login: AuthContextValue["login"] = async ({ username, password }) => {
    const body: MobileLoginRequest = {
      username,
      password,
      platform: Platform.OS as MobileLoginRequest["platform"],
      app_version: "1.0.0",
    };
    const res = await api.post<MobileLoginResponse>(Endpoints.mobileLogin, body, {
      _skipAuth: true,
    });
    await AuthStorage.setTokens(res.data.token, res.data.refresh_token);
    await AuthStorage.setUser(res.data.user);
    setUser(res.data.user as User);
  };

  const logout: AuthContextValue["logout"] = async () => {
    try {
      await api.post(Endpoints.mobileLogout, {});
    } catch {
      // ignore network errors during logout
    }
    await AuthStorage.clear();
    setUser(null);
  };

  const refreshUser: AuthContextValue["refreshUser"] = async () => {
    try {
      const res = await api.get<{ user?: User } | User>(Endpoints.me);
      const fetched = (res.data as any).user ?? (res.data as User);
      if (fetched) {
        await AuthStorage.setUser(fetched);
        setUser(fetched);
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
