// Runtime config sourced from EXPO_PUBLIC_* env vars (must be prefixed with EXPO_PUBLIC_).
// See .env.example.

const fallbackBaseUrl = "http://localhost:5000";

export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || fallbackBaseUrl,
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 30000),
  appName: "MPBF Mobile",
} as const;
