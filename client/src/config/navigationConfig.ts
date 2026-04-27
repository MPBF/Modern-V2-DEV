import {
  LucideIcon,
  Home,
  LayoutDashboard,
  FileText,
  Activity,
  Monitor,
  ClipboardCheck,
  Wrench,
  Users,
  Warehouse,
  Database,
  BarChart3,
  Settings,
  Gauge,
  Bot,
  Box,
  Tv,
  Plug,
  Wand2,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  name_ar: string;
  name_en: string;
  icon: LucideIcon;
  path: string;
  priority: number;
  group: "primary" | "support" | "admin";
}

export const navigationItems: NavigationItem[] = [
  {
    name: "الرئيسية",
    name_ar: "الرئيسية",
    name_en: "Home",
    icon: Home,
    path: "/",
    priority: 1,
    group: "primary",
  },
  {
    name: "لوحة التحكم",
    name_ar: "لوحة التحكم",
    name_en: "Dashboard",
    icon: LayoutDashboard,
    path: "/user-dashboard",
    priority: 5,
    group: "primary",
  },
  {
    name: "الطلبات والإنتاج",
    name_ar: "الطلبات والإنتاج",
    name_en: "Orders & Production",
    icon: FileText,
    path: "/orders",
    priority: 2,
    group: "primary",
  },
  {
    name: "لوحتي",
    name_ar: "لوحتي",
    name_en: "My Dashboard",
    icon: LayoutDashboard,
    path: "/user-dashboard",
    priority: 3,
    group: "primary",
  },
  {
    name: "لوحة الإنتاج",
    name_ar: "لوحة الإنتاج",
    name_en: "Production Dashboard",
    icon: Activity,
    path: "/production-dashboard",
    priority: 3,
    group: "primary",
  },
  {
    name: "مراقبة الإنتاج",
    name_ar: "مراقبة الإنتاج",
    name_en: "Production Monitoring",
    icon: Monitor,
    path: "/production-monitoring",
    priority: 6,
    group: "primary",
  },
  {
    name: "الجودة",
    name_ar: "الجودة",
    name_en: "Quality",
    icon: ClipboardCheck,
    path: "/quality",
    priority: 7,
    group: "support",
  },
  {
    name: "الصيانة",
    name_ar: "الصيانة",
    name_en: "Maintenance",
    icon: Wrench,
    path: "/maintenance",
    priority: 8,
    group: "support",
  },
  {
    name: "الموارد البشرية",
    name_ar: "الموارد البشرية",
    name_en: "Human Resources",
    icon: Users,
    path: "/hr",
    priority: 9,
    group: "support",
  },
  {
    name: "المستودع",
    name_ar: "المستودع",
    name_en: "Warehouse",
    icon: Warehouse,
    path: "/warehouse",
    priority: 4,
    group: "primary",
  },
  {
    name: "التعريفات",
    name_ar: "التعريفات",
    name_en: "Definitions",
    icon: Database,
    path: "/definitions",
    priority: 10,
    group: "admin",
  },
  {
    name: "التقارير",
    name_ar: "التقارير",
    name_en: "Reports",
    icon: BarChart3,
    path: "/reports",
    priority: 11,
    group: "admin",
  },
  {
    name: "الأدوات",
    name_ar: "الأدوات",
    name_en: "Tools",
    icon: Wrench,
    path: "/tools",
    priority: 12,
    group: "admin",
  },
  {
    name: "الوكيل الذكي",
    name_ar: "الوكيل الذكي",
    name_en: "AI Agent",
    icon: Bot,
    path: "/ai-agent",
    priority: 5,
    group: "primary",
  },
  {
    name: "الإعدادات",
    name_ar: "الإعدادات",
    name_en: "Settings",
    icon: Settings,
    path: "/settings",
    priority: 13,
    group: "admin",
  },
  {
    name: "معالج تصميم الأكياس",
    name_ar: "معالج تصميم الأكياس",
    name_en: "Bag Configurator",
    icon: Wand2,
    path: "/bag-configurator",
    priority: 3,
    group: "primary",
  },
  {
    name: "محاكاة المصنع",
    name_ar: "محاكاة المصنع",
    name_en: "Factory Simulation",
    icon: Box,
    path: "/factory-simulation",
    priority: 6,
    group: "primary",
  },
  {
    name: "شاشة العرض",
    name_ar: "شاشة العرض",
    name_en: "Display Control",
    icon: Tv,
    path: "/display-control",
    priority: 7,
    group: "primary",
  },
];

export const getLocalizedName = (
  item: NavigationItem,
  language: "ar" | "en",
): string => {
  return language === "en" ? item.name_en : item.name_ar;
};

export const getQuickAccessItems = (
  items: NavigationItem[],
): NavigationItem[] => {
  return items
    .filter((item) => item.priority <= 4)
    .sort((a, b) => a.priority - b.priority);
};

export const groupNavigationItems = (items: NavigationItem[]) => {
  return {
    primary: items
      .filter((item) => item.group === "primary")
      .sort((a, b) => a.priority - b.priority),
    support: items
      .filter((item) => item.group === "support")
      .sort((a, b) => a.priority - b.priority),
    admin: items
      .filter((item) => item.group === "admin")
      .sort((a, b) => a.priority - b.priority),
  };
};
