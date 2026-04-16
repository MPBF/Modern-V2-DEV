import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/layout/Screen";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { useDashboard } from "@/api/hooks/useDashboard";
import { useNotifications } from "@/api/hooks/useNotifications";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const dashboard = useDashboard();
  const notifications = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const stats = dashboard.data?.stats ?? {};
  const lang = i18n.language === "en" ? "en" : "ar";
  const displayName = lang === "ar" ? user?.display_name_ar || user?.username : user?.display_name || user?.username;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dashboard.refetch(), notifications.refetch()]);
    setRefreshing(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("tabs.home"),
          headerRight: () => (
            <Pressable onPress={() => router.push("/(app)/notifications")} hitSlop={12} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="notifications-outline" color={colors.text} size={22} />
            </Pressable>
          ),
        }}
      />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.greeting}>
          <Text style={[styles.greetingHello, { color: colors.textMuted }]}>{t("auth.welcome")}</Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>{displayName}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tilesRow}>
          <StatTile
            label={t("home.totalOrders")}
            value={stats.total_orders ?? "-"}
            icon="document-text-outline"
            accent={colors.primary}
          />
          <StatTile
            label={t("home.activeProduction")}
            value={stats.active_production_orders ?? "-"}
            icon="construct-outline"
            accent={colors.info}
          />
          <StatTile
            label={t("home.openIssues")}
            value={stats.open_quality_issues ?? "-"}
            icon="warning-outline"
            accent={colors.danger}
          />
          <StatTile
            label={t("home.openMaintenance")}
            value={stats.open_maintenance_requests ?? "-"}
            icon="hammer-outline"
            accent={colors.warning}
          />
        </ScrollView>

        <Text style={[styles.section, { color: colors.text }]}>{t("home.quickActions")}</Text>
        <View style={styles.actionsGrid}>
          <ActionTile icon="document-text-outline" label={t("orders.title")} onPress={() => router.push("/(app)/orders")} />
          <ActionTile icon="construct-outline" label={t("production.title")} onPress={() => router.push("/(app)/production")} />
          <ActionTile icon="cube-outline" label={t("warehouse.title")} onPress={() => router.push("/(app)/warehouse")} />
          <ActionTile icon="warning-outline" label={t("more.quality")} onPress={() => router.push("/(app)/quality")} />
          <ActionTile icon="hammer-outline" label={t("more.maintenance")} onPress={() => router.push("/(app)/maintenance")} />
          <ActionTile icon="people-outline" label={t("more.hr")} onPress={() => router.push("/(app)/hr")} />
        </View>

        <Text style={[styles.section, { color: colors.text }]}>{t("home.recentNotifications")}</Text>
        {notifications.data && notifications.data.length > 0 ? (
          notifications.data.slice(0, 5).map((n) => (
            <Card key={n.id}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>{n.title}</Text>
              <Text style={[styles.notifBody, { color: colors.textMuted }]} numberOfLines={2}>
                {n.message}
              </Text>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={[styles.notifBody, { color: colors.textMuted }]}>{t("notifications.empty")}</Text>
          </Card>
        )}
      </Screen>
    </>
  );
}

function ActionTile({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icon} size={26} color={colors.primary} />
      <Text style={[styles.actionLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: Spacing.lg },
  greetingHello: { fontSize: FontSize.sm },
  greetingName: { fontSize: FontSize.xl, fontWeight: "800", marginTop: Spacing.xs },
  tilesRow: { paddingVertical: Spacing.sm, gap: Spacing.sm },
  section: { fontSize: FontSize.md, fontWeight: "700", marginVertical: Spacing.md },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  action: {
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 100,
    paddingVertical: Spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { marginTop: Spacing.sm, fontSize: FontSize.sm, fontWeight: "600" },
  notifTitle: { fontSize: FontSize.base, fontWeight: "700", marginBottom: Spacing.xs },
  notifBody: { fontSize: FontSize.sm, lineHeight: 20 },
});
