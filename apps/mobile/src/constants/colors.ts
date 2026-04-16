// MPBF mobile color tokens. Mirrors the web theme but tuned for native contrast.
export const Colors = {
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    border: "#e2e8f0",
    text: "#0f172a",
    textMuted: "#64748b",
    primary: "#2563eb",
    primaryText: "#ffffff",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#0ea5e9",
  },
  dark: {
    background: "#0f172a",
    surface: "#1e293b",
    surfaceAlt: "#334155",
    border: "#334155",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    primary: "#3b82f6",
    primaryText: "#ffffff",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#38bdf8",
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
