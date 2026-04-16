import { useColorScheme } from "react-native";
import { Colors, type ThemeColors } from "@/constants/colors";

export function useTheme(): { colors: ThemeColors; scheme: "light" | "dark" } {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { colors: Colors[scheme], scheme };
}
