import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOrder } from "@/api/hooks/useOrders";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { OrderStatusLabels, getStatusLabel } from "@mpbf/shared";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const { data, isLoading, isError } = useOrder(id);

  if (isLoading) return <Screen><Loader /></Screen>;
  if (isError || !data) return <Screen><EmptyState title={t("common.noData")} /></Screen>;

  const status = getStatusLabel(OrderStatusLabels, data.status, lang);
  const customerName = lang === "ar" ? (data as any).customer?.name_ar || (data as any).customer?.name : (data as any).customer?.name;

  return (
    <Screen>
      <Card>
        <View style={styles.row}>
          <Text style={[styles.orderNo, { color: colors.text }]}>#{data.order_number}</Text>
          <Badge label={status.label} color={status.color} />
        </View>
        <Field label={t("orders.customer")} value={customerName ?? "-"} />
        <Field
          label={t("orders.deliveryDate")}
          value={data.delivery_date ? format(new Date(data.delivery_date), "yyyy-MM-dd") : "-"}
        />
        <Field
          label={t("orders.createdAt")}
          value={data.created_at ? format(new Date(data.created_at), "yyyy-MM-dd HH:mm") : "-"}
        />
        {data.notes ? <Field label={"Notes"} value={data.notes} /> : null}
      </Card>
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  orderNo: { fontSize: FontSize.lg, fontWeight: "800" },
  field: { paddingVertical: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(127,127,127,0.2)" },
  fieldLabel: { fontSize: FontSize.xs, marginBottom: Spacing.xs },
  fieldValue: { fontSize: FontSize.base, fontWeight: "600" },
});
