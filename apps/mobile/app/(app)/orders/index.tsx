import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useOrders } from "@/api/hooks/useOrders";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { OrderStatusLabels, getStatusLabel } from "@mpbf/shared";

const STATUS_FILTERS = ["all", "pending", "in_production", "completed"] as const;

export default function OrdersList() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const { data, isLoading, refetch } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.name_ar?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, filter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Input placeholder={t("common.search")} value={search} onChangeText={setSearch} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((f) => {
          const active = filter === f;
          const label =
            f === "all"
              ? t("orders.filterAll")
              : getStatusLabel(OrderStatusLabels, f, lang).label;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: active ? colors.primaryText : colors.text, fontWeight: "600" }}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("orders.noOrders")} icon="document-outline" />
      ) : (
        filtered.map((o) => {
          const status = getStatusLabel(OrderStatusLabels, o.status, lang);
          const customerName = lang === "ar" ? o.customer?.name_ar || o.customer?.name : o.customer?.name;
          return (
            <Pressable key={o.id} onPress={() => router.push(`/(app)/orders/${o.id}`)}>
              <Card>
                <View style={styles.row}>
                  <Text style={[styles.orderNo, { color: colors.text }]}>#{o.order_number}</Text>
                  <Badge label={status.label} color={status.color} />
                </View>
                <Text style={[styles.customer, { color: colors.text }]} numberOfLines={1}>
                  {customerName ?? "-"}
                </Text>
                {o.delivery_date ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {t("orders.deliveryDate")}: {format(new Date(o.delivery_date), "yyyy-MM-dd")}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.sm, paddingVertical: Spacing.md },
  chip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: 999, borderWidth: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  orderNo: { fontSize: FontSize.md, fontWeight: "700" },
  customer: { fontSize: FontSize.base, marginBottom: Spacing.xs },
  meta: { fontSize: FontSize.sm },
});
