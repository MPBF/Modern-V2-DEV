import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMaintenanceRequests } from "@/api/hooks/useMaintenance";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { PriorityLabels, getStatusLabel } from "@mpbf/shared";

export default function MaintenanceScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const { data, isLoading, refetch } = useMaintenanceRequests();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
    >
      {isLoading ? (
        <Loader />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t("common.noData")} icon="hammer-outline" />
      ) : (
        data.map((m) => {
          const p = getStatusLabel(PriorityLabels, m.priority, lang);
          return (
            <Card key={m.id}>
              <View style={styles.row}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {m.request_number ? `#${m.request_number}` : `#${m.id}`}
                </Text>
                <Badge label={p.label} color={p.color} />
              </View>
              <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>{m.description}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {format(new Date(m.created_at), "yyyy-MM-dd HH:mm")} • {m.status}
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
  title: { fontSize: FontSize.md, fontWeight: "700" },
  body: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
  meta: { fontSize: FontSize.xs },
});
