import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useInventory } from "@/api/hooks/useInventory";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function WarehouseIndex() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const lang = i18n.language === "en" ? "en" : "ar";

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(
      (i) =>
        i.name?.toLowerCase().includes(q) ||
        i.name_ar?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
    >
      <Input placeholder={t("warehouse.search")} value={search} onChangeText={setSearch} />
      <View style={{ height: Spacing.md }} />
      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("common.noData")} icon="cube-outline" />
      ) : (
        filtered.map((item) => {
          const qty = Number(item.quantity ?? 0);
          const min = Number(item.min_quantity ?? 0);
          const isLow = min > 0 && qty <= min;
          const name = lang === "ar" ? item.name_ar || item.name : item.name;
          return (
            <Card key={item.id}>
              <View style={styles.row}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                {isLow ? <Badge label={t("warehouse.lowStock")} color={colors.danger} /> : null}
              </View>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {t("warehouse.quantity")}: {qty} {item.unit ?? ""}
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  name: { fontSize: FontSize.base, fontWeight: "700", flex: 1 },
  meta: { fontSize: FontSize.sm },
});
