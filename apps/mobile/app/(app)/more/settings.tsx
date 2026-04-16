import { useTranslation } from "react-i18next";
import { ScaffoldScreen } from "@/components/layout/ScaffoldScreen";

export default function Settings() {
  const { t } = useTranslation();
  return <ScaffoldScreen title={t("more.settings")} />;
}
