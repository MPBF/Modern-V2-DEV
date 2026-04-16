import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useNotifications } from "@/api/hooks/useNotifications";
import { useTheme } from "@/utils/useTheme";
import { FontSize, Spacing } from "@/constants/spacing";

export default function Notifications() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: t("notifications.title") }} />
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        {isLoading ? (
          <Loader />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t("notifications.empty")} icon="notifications-off-outline" />
        ) : (
          data.map((n) => (
            <Card key={n.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={[styles.title, { color: colors.text }]}>{n.title}</Text>
                {!n.is_read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
              </View>
              <Text style={[styles.body, { color: colors.textMuted }]}>{n.message}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {n.created_at ? format(new Date(n.created_at), "yyyy-MM-dd HH:mm") : ""}
              </Text>
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.base, fontWeight: "700", flex: 1 },
  body: { fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  time: { fontSize: FontSize.xs, marginTop: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: Spacing.sm },
});
