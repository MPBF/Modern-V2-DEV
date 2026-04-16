import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const lang = i18n.language === "en" ? "en" : "ar";
  const name = lang === "ar" ? user?.display_name_ar || user?.username : user?.display_name || user?.username;

  return (
    <>
      <Stack.Screen options={{ title: t("more.profile") }} />
      <Screen>
        <Card>
          <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
              <Ionicons name="person" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.username, { color: colors.textMuted }]}>{user?.username}</Text>
          </View>

          {user?.email ? <Field label="Email" value={user.email} /> : null}
          {user?.phone ? <Field label="Phone" value={user.phone} /> : null}
          {user?.role_name ? (
            <Field label="Role" value={lang === "ar" ? user.role_name_ar || user.role_name : user.role_name} />
          ) : null}
        </Card>
        <Button title={t("auth.logout")} variant="danger" onPress={logout} fullWidth />
      </Screen>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg },
  name: { fontSize: FontSize.xl, fontWeight: "800" },
  username: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  field: { paddingVertical: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(127,127,127,0.2)" },
  fieldLabel: { fontSize: FontSize.xs, marginBottom: Spacing.xs },
  fieldValue: { fontSize: FontSize.base, fontWeight: "600" },
});
