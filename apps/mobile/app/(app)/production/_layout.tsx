import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ProductionLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("production.title") }} />
      <Stack.Screen name="rolls" options={{ title: t("production.rolls") }} />
      <Stack.Screen name="roll-update" options={{ title: t("production.updateRoll") }} />
    </Stack>
  );
}
