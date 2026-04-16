import { StyleSheet, Text, View } from "react-native";
import { FontSize, Radius, Spacing } from "@/constants/spacing";

interface Props {
  label: string;
  color?: string;
}

export function Badge({ label, color = "#6b7280" }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: { fontSize: FontSize.xs, fontWeight: "700" },
});
