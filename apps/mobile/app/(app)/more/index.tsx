import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export default function More() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const displayName = lang === "ar" ? user?.display_name_ar || user?.username : user?.display_name || user?.username;

  const items: Item[] = [
    { icon: "person-circle-outline", label: t("more.profile"), onPress: () => router.push("/(app)/profile") },
    { icon: "document-text-outline", label: t("more.myOrders"), onPress: () => router.push("/(app)/orders/my-orders") },
    { icon: "people-outline", label: t("more.hr"), onPress: () => router.push("/(app)/hr") },
    { icon: "hammer-outline", label: t("more.maintenance"), onPress: () => router.push("/(app)/maintenance") },
    { icon: "warning-outline", label: t("more.quality"), onPress: () => router.push("/(app)/quality") },
    { icon: "stats-chart-outline", label: t("more.reports"), onPress: () => router.push("/(app)/more/reports") },
    { icon: "settings-outline", label: t("more.settings"), onPress: () => router.push("/(app)/more/settings") },
  ];

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.role, { color: colors.textMuted }]}>
              {(lang === "ar" ? user?.role_name_ar : user?.role_name) || user?.username}
            </Text>
          </View>
        </View>
      </Card>

      {items.map((it) => (
        <Pressable
          key={it.label}
          onPress={it.onPress}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name={it.icon} size={22} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>{it.label}</Text>
          <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        </Pressable>
      ))}

      <View style={{ height: Spacing.xl }} />
      <Button title={t("auth.logout")} variant="danger" onPress={logout} fullWidth />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  name: { fontSize: FontSize.md, fontWeight: "800" },
  role: { fontSize: FontSize.sm, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  rowLabel: { flex: 1, fontSize: FontSize.base, fontWeight: "600" },
});
