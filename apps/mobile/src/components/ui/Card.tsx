import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { Radius, Spacing } from "@/constants/spacing";

interface Props extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, padding: padded ? Spacing.lg : 0 },
        style as any,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
});
