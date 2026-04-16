import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useMyOrders } from "@/api/hooks/useOrders";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { OrderStatusLabels, getStatusLabel } from "@mpbf/shared";

export default function MyOrdersScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const { data, isLoading, refetch } = useMyOrders();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: t("orders.myOrders") }} />
      <Screen
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
      >
        {isLoading ? (
          <Loader />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t("orders.noOrders")} icon="document-outline" />
        ) : (
          data.map((o) => {
            const status = getStatusLabel(OrderStatusLabels, o.status, lang);
            return (
              <Pressable key={o.id} onPress={() => router.push(`/(app)/orders/${o.id}`)}>
                <Card>
                  <View style={styles.row}>
                    <Text style={[styles.orderNo, { color: colors.text }]}>#{o.order_number}</Text>
                    <Badge label={status.label} color={status.color} />
                  </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  orderNo: { fontSize: FontSize.md, fontWeight: "700" },
  meta: { fontSize: FontSize.sm },
});
