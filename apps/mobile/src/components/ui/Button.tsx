import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Radius, Spacing } from "@/constants/spacing";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ title, variant = "primary", loading, disabled, fullWidth, style, ...rest }: Props) {
  const { colors } = useTheme();
  const palette = variantColors(colors, variant);

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style as any,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.text, { color: palette.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

function variantColors(c: ReturnType<typeof useTheme>["colors"], v: Variant) {
  switch (v) {
    case "secondary":
      return { bg: c.surface, border: c.border, text: c.text };
    case "danger":
      return { bg: c.danger, border: c.danger, text: "#ffffff" };
    case "ghost":
      return { bg: "transparent", border: "transparent", text: c.primary };
    default:
      return { bg: c.primary, border: c.primary, text: c.primaryText };
  }
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: FontSize.base, fontWeight: "600" },
});
