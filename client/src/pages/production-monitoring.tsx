import { useQuery } from "@tanstack/react-query";
import {
  Film,
  Printer,
  Scissors,
  Users,
  TrendingUp,
  RefreshCw,
  Package,
  Activity,
  Target,
  CheckCircle2,
  Factory,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  Palette,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import PageLayout from "../components/layout/PageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useLocalizedName } from "../hooks/use-localized-name";

const SECTION_COLORS = {
  film: "#3B82F6",
  printing: "#8B5CF6",
  cutting: "#F59E0B",
  done: "#22C55E",
};

export default function ProductionMonitoring() {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null);
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    setDateFrom(yearAgo.toISOString().split("T")[0]);
    setDateTo(now.toISOString().split("T")[0]);
  }, []);

  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/production/monitoring-dashboard", { dateFrom, dateTo }],
    enabled: !!dateFrom && !!dateTo,
  });

  const dashboard = dashboardData?.data;
  const summary = dashboard?.summary || {};
  const machinesList = dashboard?.machines || [];
  const workersList = dashboard?.workers || [];
  const productsList = dashboard?.products || [];
  const materials = dashboard?.materials || {
    recipes: [],
    orders: [],
    facets: { raw_materials: [], colors: [], categories: [] },
  };
  const [matStatusFilter, setMatStatusFilter] = useState<string>("all");

  const COMPONENT_KEYS = ["HDPE", "LLDPE", "LDPE", "FILLER", "COLOR"] as const;
  const COMPONENT_COLORS: Record<string, string> = {
    HDPE: "bg-blue-50 text-blue-700 border-blue-200",
    LLDPE: "bg-indigo-50 text-indigo-700 border-indigo-200",
    LDPE: "bg-violet-50 text-violet-700 border-violet-200",
    FILLER: "bg-amber-50 text-amber-700 border-amber-200",
    COLOR: "bg-pink-50 text-pink-700 border-pink-200",
  };
  const STATUS_LABELS_AR_MAT: Record<string, string> = {
    all: "كل الحالات",
    pending: "قيد الانتظار",
    active: "قيد التنفيذ",
    completed: "مكتمل",
    archived: "مؤرشف",
    cancelled: "ملغي",
  };

  const recipesMap = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const r of materials.recipes || []) m[r.key] = r.components || {};
    return m;
  }, [materials.recipes]);

  const materialAggregates = useMemo(() => {
    const totals: Record<string, number> = {
      HDPE: 0,
      LLDPE: 0,
      LDPE: 0,
      FILLER: 0,
      COLOR: 0,
    };
    let totalKg = 0;
    let orderCount = 0;
    const orders: any[] = materials.orders || [];

    for (const o of orders) {
      if (matStatusFilter !== "all" && o.status !== matStatusFilter) continue;
      // Basis per status: pending → planned (final_quantity_kg);
      // active/completed/archived → actual produced_quantity_kg; cancelled → excluded.
      const basis =
        o.status === "pending"
          ? o.final_quantity_kg || 0
          : o.status === "cancelled"
            ? 0
            : o.produced_quantity_kg || 0;
      if (basis <= 0 || !o.recipe_key) continue;
      const comps = recipesMap[o.recipe_key];
      if (!comps) continue;
      for (const k of COMPONENT_KEYS) {
        const pct = comps[k] || 0;
        totals[k] += (basis * pct) / 100;
      }
      totalKg += basis;
      orderCount += 1;
    }
    return { totals, totalKg, orderCount };
  }, [materials.orders, recipesMap, matStatusFilter]);
  const STATUS_LABELS_AR: Record<string, string> = {
    pending: "قيد الانتظار",
    active: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    archived: "مؤرشف",
  };
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-700",
  };

  const formatNum = (n: number = 0) =>
    new Intl.NumberFormat("en-US").format(Math.round(n));
  const formatKg = (n: number = 0) =>
    `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n)} كجم`;

  const sectionPieData = useMemo(
    () =>
      [
        {
          name: "فيلم",
          value: summary.film_kg || 0,
          color: SECTION_COLORS.film,
        },
        {
          name: "طباعة",
          value: summary.printing_kg || 0,
          color: SECTION_COLORS.printing,
        },
        {
          name: "تقطيع",
          value: summary.cutting_kg || 0,
          color: SECTION_COLORS.cutting,
        },
        {
          name: "مكتمل",
          value: summary.done_kg || 0,
          color: SECTION_COLORS.done,
        },
      ].filter((d) => d.value > 0),
    [summary],
  );

  const machineChartData = useMemo(
    () =>
      machinesList.slice(0, 10).map((m: any) => ({
        name: ln(m.name_ar, m.name),
        total: m.total_kg,
      })),
    [machinesList, ln],
  );

  const workerChartData = useMemo(
    () =>
      workersList.slice(0, 10).map((w: any) => ({
        name: ln(w.name_ar, w.name),
        total: w.total_kg,
      })),
    [workersList, ln],
  );

  if (isLoading && !dashboard) {
    return (
      <PageLayout
        title="مراقبة الإنتاج"
        description="إحصائيات ومراقبة عمليات الإنتاج"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Activity className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="مراقبة الإنتاج"
      description="إحصائيات ومراقبة عمليات الإنتاج"
    >
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              الفترة:
            </span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">إلى</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-r-4 border-r-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    إجمالي الإنتاج
                  </p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatKg(summary.total_kg)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-r-slate-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">عدد الرولات</p>
                  <p className="text-xl font-bold">
                    {formatNum(summary.total_rolls)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-r-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">فيلم</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatKg(summary.film_kg)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.film_rolls} رول
                  </p>
                </div>
                <Film className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-r-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">طباعة</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatKg(summary.printing_kg)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.printing_rolls} رول
                  </p>
                </div>
                <Printer className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-r-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">تقطيع</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatKg(summary.cutting_kg)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.cutting_rolls} رول
                  </p>
                </div>
                <Scissors className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-r-4 border-r-red-400">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">الهدر</p>
                  <p className="text-xl font-bold text-red-500">
                    {formatKg(summary.total_waste_kg)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.total_kg > 0
                      ? (
                          (summary.total_waste_kg / summary.total_kg) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="py-2.5 gap-2">
              <Activity className="w-4 h-4" />
              <span>نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="machines" className="py-2.5 gap-2">
              <Factory className="w-4 h-4" />
              <span>المكائن</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="py-2.5 gap-2">
              <Users className="w-4 h-4" />
              <span>العمال</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="py-2.5 gap-2">
              <Layers className="w-4 h-4" />
              <span>المواد الخام</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="py-2.5 gap-2">
              <Award className="w-4 h-4" />
              <span>المنتجات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    توزيع الإنتاج حسب المرحلة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={sectionPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, value }) =>
                            `${name}: ${formatKg(value)}`
                          }
                        >
                          {sectionPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatKg(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-5 w-5 text-primary" />
                    أعلى 10 مكائن إنتاجاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {machineChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={machineChartData}
                        layout="vertical"
                        margin={{ right: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip formatter={(v: number) => formatKg(v)} />
                        <Bar
                          dataKey="total"
                          fill="#6366F1"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    أعلى 10 عمال إنتاجاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workerChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={workerChartData}
                        layout="vertical"
                        margin={{ right: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip formatter={(v: number) => formatKg(v)} />
                        <Bar
                          dataKey="total"
                          fill="#22C55E"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    أكثر المنتجات إنتاجاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsList.length > 0 ? (
                    <div className="space-y-3">
                      {productsList.slice(0, 8).map((p: any, i: number) => {
                        const maxKg = productsList[0]?.total_kg || 1;
                        const percent = (p.total_kg / maxKg) * 100;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {i + 1}
                                </Badge>
                                <span className="font-medium">
                                  {ln(p.item_name_ar, p.item_name) ||
                                    p.size_caption ||
                                    "غير محدد"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({ln(p.customer_name_ar, p.customer_name)})
                                </span>
                              </div>
                              <span className="font-bold">
                                {formatKg(p.total_kg)}
                              </span>
                            </div>
                            <Progress value={percent} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    إنتاج المكائن التفصيلي
                    <Badge variant="secondary">{machinesList.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">الماكينة</TableHead>
                      <TableHead className="font-semibold">النوع</TableHead>
                      <TableHead className="font-semibold text-center">
                        إجمالي الإنتاج
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        عدد الرولات
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        آخر إنتاج
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        تفاصيل
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machinesList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Factory className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          لا توجد بيانات إنتاج للمكائن
                        </TableCell>
                      </TableRow>
                    ) : (
                      machinesList.map((m: any) => {
                        const isExpanded = expandedMachine === m.id;
                        const maxKg = machinesList[0]?.total_kg || 1;
                        return (
                          <MachineRow
                            key={m.id}
                            machine={m}
                            maxKg={maxKg}
                            isExpanded={isExpanded}
                            onToggle={() =>
                              setExpandedMachine(isExpanded ? null : m.id)
                            }
                            ln={ln}
                            formatKg={formatKg}
                            formatNum={formatNum}
                          />
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    إنتاج العمال التفصيلي
                    <Badge variant="secondary">{workersList.length}</Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">العامل</TableHead>
                      <TableHead className="font-semibold text-center">
                        إجمالي الإنتاج
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        عدد الرولات
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        تفاصيل
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workersList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          لا توجد بيانات إنتاج للعمال
                        </TableCell>
                      </TableRow>
                    ) : (
                      workersList.map((w: any) => {
                        const isExpanded = expandedWorker === w.id;
                        const maxKg = workersList[0]?.total_kg || 1;
                        return (
                          <WorkerRow
                            key={w.id}
                            worker={w}
                            maxKg={maxKg}
                            isExpanded={isExpanded}
                            onToggle={() =>
                              setExpandedWorker(isExpanded ? null : w.id)
                            }
                            ln={ln}
                            formatKg={formatKg}
                            formatNum={formatNum}
                          />
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  المواد الخام المطلوبة
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  الحساب بحسب الوصفات الثابتة: HDPE ملون (35/35/25/5)، HDPE شفاف
                  (50/50)، LDPE ملون (LLDPE 60 / LDPE 10 / 25 / 5)، LDPE شفاف
                  (LLDPE 80 / LDPE 20). الكميات بالكيلوجرام.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="text-xs text-muted-foreground mb-1 block">
                      حالة أمر الإنتاج
                    </label>
                    <Select
                      value={matStatusFilter}
                      onValueChange={setMatStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="active">قيد التنفيذ</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                        <SelectItem value="archived">مؤرشف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formatNum(materialAggregates.orderCount)}
                    </span>{" "}
                    أمر إنتاج —{" "}
                    <span className="font-semibold text-foreground">
                      {formatKg(materialAggregates.totalKg)}
                    </span>{" "}
                    إجمالي الإنتاج
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {COMPONENT_KEYS.map((k) => (
                    <div
                      key={k}
                      className={`rounded-lg border p-4 text-center ${COMPONENT_COLORS[k]}`}
                    >
                      <p className="text-sm font-semibold mb-1">{k}</p>
                      <p className="text-2xl font-bold">
                        {formatKg(materialAggregates.totals[k])}
                      </p>
                      <p className="text-[10px] opacity-75 mt-1">
                        {materialAggregates.totalKg > 0
                          ? (
                              (materialAggregates.totals[k] /
                                materialAggregates.totalKg) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  أكثر المنتجات إنتاجاً
                  <Badge variant="secondary">{productsList.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-12 text-center">
                        #
                      </TableHead>
                      <TableHead className="font-semibold">المنتج</TableHead>
                      <TableHead className="font-semibold">العميل</TableHead>
                      <TableHead className="font-semibold">المقاس</TableHead>
                      <TableHead className="font-semibold text-center">
                        الإنتاج (كجم)
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        عدد الرولات
                      </TableHead>
                      <TableHead className="font-semibold text-center">
                        النسبة
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          لا توجد بيانات إنتاج
                        </TableCell>
                      </TableRow>
                    ) : (
                      productsList.map((p: any, i: number) => {
                        const maxKg = productsList[0]?.total_kg || 1;
                        const percent = (p.total_kg / maxKg) * 100;
                        return (
                          <TableRow key={i} className="hover:bg-muted/50">
                            <TableCell className="text-center">
                              {i < 3 ? (
                                <Badge
                                  className={
                                    i === 0
                                      ? "bg-yellow-500"
                                      : i === 1
                                        ? "bg-gray-400"
                                        : "bg-amber-700"
                                  }
                                >
                                  {i + 1}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  {i + 1}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {ln(p.item_name_ar, p.item_name) || "غير محدد"}
                            </TableCell>
                            <TableCell>
                              {ln(p.customer_name_ar, p.customer_name)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {p.size_caption || "-"}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {formatKg(p.total_kg)}
                            </TableCell>
                            <TableCell className="text-center">
                              {formatNum(p.total_rolls)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="w-20 mx-auto">
                                <Progress value={percent} className="h-2" />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

function MachineRow({
  machine: m,
  maxKg,
  isExpanded,
  onToggle,
  ln,
  formatKg,
  formatNum,
}: any) {
  const typeLabels: Record<string, string> = {
    extruder: "إكسترودر",
    printer: "طابعة",
    cutter: "مقطع",
    quality_check: "فحص جودة",
  };
  const percent = maxKg > 0 ? (m.total_kg / maxKg) * 100 : 0;

  return (
    <>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={onToggle}>
        <TableCell>
          <div className="font-bold">{ln(m.name_ar, m.name)}</div>
          <div className="text-xs text-muted-foreground">{m.id}</div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{typeLabels[m.type] || m.type}</Badge>
        </TableCell>
        <TableCell className="text-center">
          <div className="space-y-1">
            <div className="font-bold">{formatKg(m.total_kg)}</div>
            <div className="w-20 mx-auto">
              <Progress value={percent} className="h-1.5" />
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center font-semibold">
          {formatNum(m.total_rolls)}
        </TableCell>
        <TableCell className="text-center text-sm text-muted-foreground">
          {m.last_production
            ? new Date(m.last_production).toLocaleDateString("en-US")
            : "-"}
        </TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center border border-blue-200">
                <Film className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs text-muted-foreground">فيلم</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatKg(m.film_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.film_rolls} رول
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center border border-purple-200">
                <Printer className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-xs text-muted-foreground">طباعة</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatKg(m.printing_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.printing_rolls} رول
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 text-center border border-amber-200">
                <Scissors className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="text-xs text-muted-foreground">تقطيع</div>
                <div className="text-lg font-bold text-amber-600">
                  {formatKg(m.cutting_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.cutting_rolls} رول
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function WorkerRow({
  worker: w,
  maxKg,
  isExpanded,
  onToggle,
  ln,
  formatKg,
  formatNum,
}: any) {
  const percent = maxKg > 0 ? (w.total_kg / maxKg) * 100 : 0;

  return (
    <>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={onToggle}>
        <TableCell>
          <div className="font-bold">{ln(w.name_ar, w.name)}</div>
        </TableCell>
        <TableCell className="text-center">
          <div className="space-y-1">
            <div className="font-bold">{formatKg(w.total_kg)}</div>
            <div className="w-20 mx-auto">
              <Progress value={percent} className="h-1.5" />
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center font-semibold">
          {formatNum(w.total_rolls)}
        </TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/30 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center border border-blue-200">
                <Film className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-xs text-muted-foreground">فيلم</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatKg(w.film_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {w.film_rolls} رول
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center border border-purple-200">
                <Printer className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-xs text-muted-foreground">طباعة</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatKg(w.printing_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {w.printing_rolls} رول
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 text-center border border-amber-200">
                <Scissors className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="text-xs text-muted-foreground">تقطيع</div>
                <div className="text-lg font-bold text-amber-600">
                  {formatKg(w.cutting_kg)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {w.cutting_rolls} رول
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
