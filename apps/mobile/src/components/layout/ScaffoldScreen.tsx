import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { Screen } from "./Screen";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  title: string;
  description?: string;
}

// Generic placeholder for screens that are scaffolded but not yet fully implemented.
// They keep navigation, back-button, and theming consistent with real screens.
export function ScaffoldScreen({ title, description }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen>
        <EmptyState
          title={title}
          subtitle={description ?? t("scaffold.subtitle")}
          icon="construct-outline"
        />
      </Screen>
    </>
  );
}
