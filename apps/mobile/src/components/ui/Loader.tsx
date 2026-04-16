import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "@/utils/useTheme";

export function Loader({ fullscreen = false }: { fullscreen?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, fullscreen && { flex: 1, backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, alignItems: "center", justifyContent: "center" },
});
