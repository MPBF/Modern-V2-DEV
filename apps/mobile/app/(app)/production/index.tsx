import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProductionOrders } from "@/api/hooks/useProduction";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function ProductionIndex() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useProductionOrders();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
    >
      <Pressable onPress={() => router.push("/(app)/production/rolls")} style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Ionicons name="albums-outline" size={20} color={colors.primaryText} />
        <Text style={[styles.ctaText, { color: colors.primaryText }]}>{t("production.rolls")}</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.text }]}>{t("production.productionOrders")}</Text>

      {isLoading ? (
        <Loader />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t("common.noData")} icon="construct-outline" />
      ) : (
        data.map((p) => (
          <Card key={p.id}>
            <View style={styles.row}>
              <Text style={[styles.no, { color: colors.text }]}>#{p.production_order_number}</Text>
              <Badge label={p.status} color={colors.info} />
            </View>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {t("production.weight")}: {String(p.quantity_kg)} kg
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  ctaText: { fontSize: FontSize.base, fontWeight: "700" },
  section: { fontSize: FontSize.md, fontWeight: "700", marginBottom: Spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  no: { fontSize: FontSize.md, fontWeight: "700" },
  meta: { fontSize: FontSize.sm },
});
