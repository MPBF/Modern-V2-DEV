import { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import * as Updates from "expo-updates";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import { AuthProvider } from "@/auth/AuthContext";
import { queryClient } from "@/api/queryClient";
import i18n from "@/i18n";
import { useTheme } from "@/utils/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors, scheme } = useTheme();

  useEffect(() => {
    // Force RTL for the Arabic-first UI. forceRTL only takes effect after a
    // full reload, so on the first install we toggle the flag and reload once
    // (no-op in dev/web where Updates.reloadAsync isn't supported).
    if (!I18nManager.isRTL) {
      try {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        if (Platform.OS !== "web" && !__DEV__) {
          Updates.reloadAsync().catch(() => {});
        }
      } catch {}
    }
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.surface },
                  headerTitleStyle: { color: colors.text, fontWeight: "700" },
                  headerTintColor: colors.primary,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
              </Stack>
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
