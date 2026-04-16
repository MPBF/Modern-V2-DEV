import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function OrdersLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("orders.title") }} />
      <Stack.Screen name="[id]" options={{ title: t("orders.details") }} />
      <Stack.Screen name="my-orders" options={{ title: t("orders.myOrders") }} />
    </Stack>
  );
}
