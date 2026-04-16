import { useTranslation } from "react-i18next";
import { ScaffoldScreen } from "@/components/layout/ScaffoldScreen";

export default function Reports() {
  const { t } = useTranslation();
  return <ScaffoldScreen title={t("more.reports")} />;
}
