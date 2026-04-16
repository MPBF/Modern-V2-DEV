import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/layout/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t("common.error"), t("auth.loginError"));
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      router.replace("/(app)/home");
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message ?? t("auth.loginError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}>
          <Text style={[styles.title, { color: colors.text }]}>{t("app.name")}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t("app.tagline")}</Text>
        </View>

        <View style={{ marginTop: Spacing.xl }}>
          <Input
            label={t("auth.username")}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
          <View style={{ height: Spacing.md }} />
          <Input
            label={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />
          <View style={{ height: Spacing.xl }} />
          <Button title={t("auth.login")} onPress={onSubmit} loading={submitting} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", paddingTop: Spacing.xxxl, marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: "800" },
  subtitle: { fontSize: FontSize.sm, marginTop: Spacing.xs, textAlign: "center" },
});
