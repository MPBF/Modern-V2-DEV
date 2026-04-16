import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRolls } from "@/api/hooks/useProduction";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { RollStageLabels, getStatusLabel } from "@mpbf/shared";

const STAGES = ["all", "film", "printing", "cutting", "done"] as const;

export default function Rolls() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const [stage, setStage] = useState<(typeof STAGES)[number]>("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useRolls(stage === "all" ? undefined : { stage });
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.roll_number?.toLowerCase().includes(q));
    }
    return list;
  }, [data, search]);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
    >
      <Input placeholder={t("common.search")} value={search} onChangeText={setSearch} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STAGES.map((s) => {
          const active = stage === s;
          const label = s === "all" ? t("orders.filterAll") : getStatusLabel(RollStageLabels, s, lang).label;
          return (
            <Pressable
              key={s}
              onPress={() => setStage(s)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
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
        <EmptyState title={t("common.noData")} icon="albums-outline" />
      ) : (
        filtered.map((r) => {
          const st = getStatusLabel(RollStageLabels, r.stage, lang);
          return (
            <Pressable
              key={r.id}
              onPress={() => router.push({ pathname: "/(app)/production/roll-update", params: { id: String(r.id) } })}
            >
              <Card>
                <View style={styles.row}>
                  <Text style={[styles.no, { color: colors.text }]}>#{r.roll_number}</Text>
                  <Badge label={st.label} color={st.color} />
                </View>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {t("production.weight")}: {r.weight_kg ? String(r.weight_kg) : "-"}
                </Text>
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
  no: { fontSize: FontSize.md, fontWeight: "700" },
  meta: { fontSize: FontSize.sm },
});
