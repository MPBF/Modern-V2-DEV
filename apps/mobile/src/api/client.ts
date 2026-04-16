import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { Config } from "@/constants/config";
import { AuthStorage } from "@/auth/storage";
import { authForcedLogout } from "@/auth/events";
import { Endpoints, type MobileRefreshResponse } from "@mpbf/shared";

// Shared axios instance.
//  - Attaches the bearer token on every request (unless _skipAuth is set).
//  - On a 401, performs a single de-duplicated refresh, then retries the request.
//  - If the refresh fails, clears storage AND notifies AuthContext via authForcedLogout
//    so the UI can flip to the logged-out state immediately (no stale "authenticated" state).

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(api: AxiosInstance): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refresh = await AuthStorage.getRefreshToken();
      if (!refresh) {
        await AuthStorage.clear();
        authForcedLogout.emit();
        return null;
      }
      const res = await api.post<MobileRefreshResponse>(
        Endpoints.mobileRefresh,
        { refresh_token: refresh },
        { _skipAuth: true },
      );
      const data = res.data;
      await AuthStorage.setTokens(data.token, data.refresh_token);
      return data.token;
    } catch {
      await AuthStorage.clear();
      authForcedLogout.emit();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: Config.apiBaseUrl,
    timeout: Config.apiTimeoutMs,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });

  instance.interceptors.request.use(async (config) => {
    if (config._skipAuth) return config;
    const token = await AuthStorage.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined;
      const status = error.response?.status;

      if (status === 401 && config && !config._retry && !config._skipAuth) {
        const newToken = await refreshAccessToken(instance);
        if (newToken) {
          config._retry = true;
          config.headers = config.headers ?? {};
          (config.headers as any).Authorization = `Bearer ${newToken}`;
          return instance.request(config);
        }
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
}

export interface NormalizedApiError {
  status: number;
  message: string;
  code?: string;
  raw?: unknown;
}

function normalizeError(error: AxiosError): NormalizedApiError {
  const status = error.response?.status ?? 0;
  const data: any = error.response?.data;
  const message =
    data?.message ||
    data?.error_description ||
    data?.error ||
    error.message ||
    "حدث خطأ غير متوقع";
  return { status, message, code: data?.code, raw: data };
}

export const api = createApiClient();
