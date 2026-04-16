import { StyleSheet, Text, View } from "react-native";
import { Card } from "./Card";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
}

export function StatTile({ label, value, icon, accent }: Props) {
  const { colors } = useTheme();
  const color = accent || colors.primary;
  return (
    <Card style={styles.tile}>
      <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
        {icon ? <Ionicons name={icon} size={20} color={color} /> : null}
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 140, alignItems: "flex-start", marginHorizontal: Spacing.xs },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  value: { fontSize: FontSize.xl, fontWeight: "800", marginBottom: Spacing.xs },
  label: { fontSize: FontSize.sm },
});
