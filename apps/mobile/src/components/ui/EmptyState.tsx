import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

interface Props {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ title, subtitle, icon = "information-circle-outline" }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: Spacing.xxl, alignItems: "center", justifyContent: "center" },
  title: { fontSize: FontSize.md, fontWeight: "700", marginTop: Spacing.lg, textAlign: "center" },
  subtitle: { fontSize: FontSize.sm, marginTop: Spacing.sm, textAlign: "center", lineHeight: 22 },
});
