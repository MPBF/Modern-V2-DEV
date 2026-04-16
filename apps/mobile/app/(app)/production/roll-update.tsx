import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMarkPrinted, useUpdateRoll } from "@/api/hooks/useProduction";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function RollUpdate() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const update = useUpdateRoll();
  const markPrinted = useMarkPrinted();

  const [weight, setWeight] = useState("");
  const [waste, setWaste] = useState("");
  const [cutWeight, setCutWeight] = useState("");

  const onSave = async () => {
    const data: any = {};
    if (weight) data.weight_kg = Number(weight);
    if (waste) data.waste_kg = Number(waste);
    if (cutWeight) data.cut_weight_total_kg = Number(cutWeight);
    if (Object.keys(data).length === 0) {
      Alert.alert(t("common.error"), t("common.noData"));
      return;
    }
    try {
      await update.mutateAsync({ id, data });
      Alert.alert(t("common.ok"), t("common.save"));
      router.back();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? "");
    }
  };

  const onMarkPrinted = async () => {
    try {
      await markPrinted.mutateAsync(id);
      Alert.alert(t("common.ok"), t("production.markPrinted"));
      router.back();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? "");
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("production.rollNumber")} #{id}
        </Text>
        <View style={{ height: Spacing.md }} />
        <Input label={t("production.weight")} value={weight} onChangeText={setWeight} keyboardType="numeric" />
        <View style={{ height: Spacing.md }} />
        <Input label={t("production.waste")} value={waste} onChangeText={setWaste} keyboardType="numeric" />
        <View style={{ height: Spacing.md }} />
        <Input label={t("production.cutWeight")} value={cutWeight} onChangeText={setCutWeight} keyboardType="numeric" />
        <View style={{ height: Spacing.lg }} />
        <Button title={t("production.submitWeight")} onPress={onSave} loading={update.isPending} fullWidth />
        <View style={{ height: Spacing.sm }} />
        <Button
          title={t("production.markPrinted")}
          onPress={onMarkPrinted}
          loading={markPrinted.isPending}
          variant="secondary"
          fullWidth
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.lg, fontWeight: "800" },
});
