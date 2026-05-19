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
  const [matRawFilter, setMatRawFilter] = useState<string>("all");
  const [matColorFilter, setMatColorFilter] = useState<string>("all");
  const [matCategoryFilter, setMatCategoryFilter] = useState<string>("all");
  const [matRecipeFilter, setMatRecipeFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    const orders: any[] = materials.orders || [];
    return orders.filter((o: any) => {
      if (matRawFilter !== "all" && o.raw_material !== matRawFilter)
        return false;
      if (matColorFilter !== "all" && o.master_batch !== matColorFilter)
        return false;
      if (
        matCategoryFilter !== "all" &&
        (o.category_id || "") !== matCategoryFilter
      )
        return false;
      if (matRecipeFilter !== "all") {
        if (matRecipeFilter === "unclassified") {
          if (o.recipe_key) return false;
        } else if (o.recipe_key !== matRecipeFilter) return false;
      }
      return true;
    });
  }, [
    materials.orders,
    matRawFilter,
    matColorFilter,
    matCategoryFilter,
    matRecipeFilter,
  ]);

  const COMPONENT_KEYS = ["HDPE", "LLDPE", "LDPE", "FILLER", "COLOR"] as const;
  const COMPONENT_COLORS: Record<string, string> = {
    HDPE: "bg-blue-50 text-blue-700 border-blue-200",
    LLDPE: "bg-indigo-50 text-indigo-700 border-indigo-200",
    LDPE: "bg-violet-50 text-violet-700 border-violet-200",
    FILLER: "bg-amber-50 text-amber-700 border-amber-200",
    COLOR: "bg-pink-50 text-pink-700 border-pink-200",
  };

  const materialAggregates = useMemo(() => {
    const blank = () => ({ HDPE: 0, LLDPE: 0, LDPE: 0, FILLER: 0, COLOR: 0 });
    const required = blank();
    const consumed = blank();
    let requiredOrders = 0;
    let consumedOrders = 0;
    let requiredKg = 0;
    let consumedKg = 0;
    const byRecipe: Record<
      string,
      {
        recipe_key: string | null;
        recipe_label_ar: string;
        required_kg: number;
        consumed_kg: number;
        required_orders: number;
        consumed_orders: number;
        required_components: Record<string, number>;
        consumed_components: Record<string, number>;
      }
    > = {};
    const byCategory: Record<
      string,
      {
        category_id: string | null;
        category_name_ar: string;
        required_kg: number;
        consumed_kg: number;
        required_orders: number;
        consumed_orders: number;
      }
    > = {};
    const byColor: Record<
      string,
      {
        master_batch: string;
        color_name_ar: string;
        color_hex: string;
        required_kg: number;
        consumed_kg: number;
        required_orders: number;
        consumed_orders: number;
      }
    > = {};

    for (const o of filteredOrders) {
      const rc = o.required_components || {};
      const cc = o.consumed_components || {};
      for (const k of COMPONENT_KEYS) {
        required[k] += rc[k] || 0;
        consumed[k] += cc[k] || 0;
      }
      if ((o.basis_required_kg || 0) > 0) {
        requiredOrders += 1;
        requiredKg += o.basis_required_kg || 0;
      }
      if ((o.basis_consumed_kg || 0) > 0) {
        consumedOrders += 1;
        consumedKg += o.basis_consumed_kg || 0;
      }

      const rk = o.recipe_key || "unclassified";
      if (!byRecipe[rk])
        byRecipe[rk] = {
          recipe_key: o.recipe_key || null,
          recipe_label_ar: o.recipe_label_ar || "غير مصنف",
          required_kg: 0,
          consumed_kg: 0,
          required_orders: 0,
          consumed_orders: 0,
          required_components: blank(),
          consumed_components: blank(),
        };
      byRecipe[rk].required_kg += o.basis_required_kg || 0;
      byRecipe[rk].consumed_kg += o.basis_consumed_kg || 0;
      if ((o.basis_required_kg || 0) > 0) byRecipe[rk].required_orders += 1;
      if ((o.basis_consumed_kg || 0) > 0) byRecipe[rk].consumed_orders += 1;
      for (const k of COMPONENT_KEYS) {
        byRecipe[rk].required_components[k] += rc[k] || 0;
        byRecipe[rk].consumed_components[k] += cc[k] || 0;
      }

      const catKey = o.category_id || "uncat";
      if (!byCategory[catKey])
        byCategory[catKey] = {
          category_id: o.category_id || null,
          category_name_ar: o.category_name_ar || "بدون فئة",
          required_kg: 0,
          consumed_kg: 0,
          required_orders: 0,
          consumed_orders: 0,
        };
      byCategory[catKey].required_kg += o.basis_required_kg || 0;
      byCategory[catKey].consumed_kg += o.basis_consumed_kg || 0;
      if ((o.basis_required_kg || 0) > 0) byCategory[catKey].required_orders += 1;
      if ((o.basis_consumed_kg || 0) > 0) byCategory[catKey].consumed_orders += 1;

      const colorKey = o.master_batch || "CLEAR";
      if (!byColor[colorKey])
        byColor[colorKey] = {
          master_batch: colorKey,
          color_name_ar: o.color_name_ar || colorKey,
          color_hex: o.color_hex || "#CCCCCC",
          required_kg: 0,
          consumed_kg: 0,
          required_orders: 0,
          consumed_orders: 0,
        };
      byColor[colorKey].required_kg += o.basis_required_kg || 0;
      byColor[colorKey].consumed_kg += o.basis_consumed_kg || 0;
      if ((o.basis_required_kg || 0) > 0) byColor[colorKey].required_orders += 1;
      if ((o.basis_consumed_kg || 0) > 0) byColor[colorKey].consumed_orders += 1;
    }

    return {
      required,
      consumed,
      requiredOrders,
      consumedOrders,
      requiredKg,
      consumedKg,
      byRecipe: Object.values(byRecipe).sort(
        (a, b) =>
          b.required_kg + b.consumed_kg - (a.required_kg + a.consumed_kg),
      ),
      byCategory: Object.values(byCategory).sort(
        (a, b) =>
          b.required_kg + b.consumed_kg - (a.required_kg + a.consumed_kg),
      ),
      byColor: Object.values(byColor).sort(
        (a, b) =>
          b.required_kg + b.consumed_kg - (a.required_kg + a.consumed_kg),
      ),
    };
  }, [filteredOrders]);
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
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  فلاتر المواد
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  الحسابات تعتمد على وصفات ثابتة (HDPE/LDPE × شفاف/ملون) دون أي
                  ربط بالمخزون. المطلوب = أوامر الانتظار، المستهلك = أوامر قيد
                  التنفيذ + المكتملة.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      نوع الخام
                    </label>
                    <Select
                      value={matRawFilter}
                      onValueChange={setMatRawFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {(materials.facets?.raw_materials || []).map(
                          (rm: string) => (
                            <SelectItem key={rm} value={rm}>
                              {rm}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      اللون (ماستر باتش)
                    </label>
                    <Select
                      value={matColorFilter}
                      onValueChange={setMatColorFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {(materials.facets?.colors || []).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-border"
                                style={{ backgroundColor: c.hex }}
                              />
                              {c.name_ar || c.name || c.id}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      الفئة
                    </label>
                    <Select
                      value={matCategoryFilter}
                      onValueChange={setMatCategoryFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {(materials.facets?.categories || []).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name_ar || c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      الوصفة
                    </label>
                    <Select
                      value={matRecipeFilter}
                      onValueChange={setMatRecipeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {(materials.recipes || []).map((r: any) => (
                          <SelectItem key={r.key} value={r.key}>
                            {r.label_ar}
                          </SelectItem>
                        ))}
                        <SelectItem value="unclassified">غير مصنف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  عدد أوامر الإنتاج المطابقة: {formatNum(filteredOrders.length)}
                </div>
              </CardContent>
            </Card>

            {/* Side-by-side: Required vs Consumed component totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-r-4 border-r-amber-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-600" />
                    مواد مطلوبة (طلبات قيد الانتظار)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    إجمالي{" "}
                    <span className="font-semibold text-foreground">
                      {formatKg(materialAggregates.requiredKg)}
                    </span>{" "}
                    من{" "}
                    <span className="font-semibold text-foreground">
                      {formatNum(materialAggregates.requiredOrders)}
                    </span>{" "}
                    أمر
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {COMPONENT_KEYS.map((k) => (
                      <div
                        key={k}
                        className={`rounded-md border p-3 text-center ${COMPONENT_COLORS[k]}`}
                      >
                        <p className="text-xs font-semibold">{k}</p>
                        <p className="text-base font-bold">
                          {formatKg(materialAggregates.required[k])}
                        </p>
                        <p className="text-[10px] opacity-75">
                          {materialAggregates.requiredKg > 0
                            ? (
                                (materialAggregates.required[k] /
                                  materialAggregates.requiredKg) *
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

              <Card className="border-r-4 border-r-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    مواد مستهلكة (قيد التنفيذ + المكتمل)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    إجمالي{" "}
                    <span className="font-semibold text-foreground">
                      {formatKg(materialAggregates.consumedKg)}
                    </span>{" "}
                    من{" "}
                    <span className="font-semibold text-foreground">
                      {formatNum(materialAggregates.consumedOrders)}
                    </span>{" "}
                    أمر
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {COMPONENT_KEYS.map((k) => (
                      <div
                        key={k}
                        className={`rounded-md border p-3 text-center ${COMPONENT_COLORS[k]}`}
                      >
                        <p className="text-xs font-semibold">{k}</p>
                        <p className="text-base font-bold">
                          {formatKg(materialAggregates.consumed[k])}
                        </p>
                        <p className="text-[10px] opacity-75">
                          {materialAggregates.consumedKg > 0
                            ? (
                                (materialAggregates.consumed[k] /
                                  materialAggregates.consumedKg) *
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
            </div>

            {/* Recipe breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  التفصيل حسب الوصفة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold whitespace-nowrap">
                        الوصفة
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap">
                        مطلوب (كجم)
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap">
                        مستهلك (كجم)
                      </TableHead>
                      {COMPONENT_KEYS.map((k) => (
                        <TableHead
                          key={k}
                          className="font-semibold text-center whitespace-nowrap"
                        >
                          {k} (مطلوب)
                        </TableHead>
                      ))}
                      {COMPONENT_KEYS.map((k) => (
                        <TableHead
                          key={`c-${k}`}
                          className="font-semibold text-center whitespace-nowrap bg-green-50"
                        >
                          {k} (مستهلك)
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialAggregates.byRecipe.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3 + COMPONENT_KEYS.length * 2}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          لا توجد أوامر إنتاج مطابقة للفلاتر
                        </TableCell>
                      </TableRow>
                    ) : (
                      materialAggregates.byRecipe.map((r) => (
                        <TableRow
                          key={r.recipe_key || "unclassified"}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            <div>{r.recipe_label_ar}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatNum(r.required_orders)} مطلوب /{" "}
                              {formatNum(r.consumed_orders)} مستهلك
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-amber-700">
                            {r.required_kg > 0 ? formatKg(r.required_kg) : "—"}
                          </TableCell>
                          <TableCell className="text-center font-bold text-green-700">
                            {r.consumed_kg > 0 ? formatKg(r.consumed_kg) : "—"}
                          </TableCell>
                          {COMPONENT_KEYS.map((k) => (
                            <TableCell
                              key={k}
                              className="text-center text-sm"
                            >
                              {r.required_components[k] > 0
                                ? formatKg(r.required_components[k])
                                : "—"}
                            </TableCell>
                          ))}
                          {COMPONENT_KEYS.map((k) => (
                            <TableCell
                              key={`c-${k}`}
                              className="text-center text-sm bg-green-50/50"
                            >
                              {r.consumed_components[k] > 0
                                ? formatKg(r.consumed_components[k])
                                : "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recipe legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  الوصفات المستخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(materials.recipes || []).map((r: any) => (
                    <div
                      key={r.key}
                      className="rounded-md border p-3 bg-muted/30"
                    >
                      <p className="text-sm font-semibold mb-2">
                        {r.label_ar}
                      </p>
                      <div className="space-y-1">
                        {Object.entries(r.components).map(([c, pct]) => (
                          <div
                            key={c}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="font-medium">{c}</span>
                            <span className="text-muted-foreground">
                              {String(pct)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Breakdown by category & color */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    حسب الفئة
                    <Badge variant="secondary">
                      {materialAggregates.byCategory.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold whitespace-nowrap">
                          الفئة
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          مطلوب
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          مستهلك
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialAggregates.byCategory.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground"
                          >
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      ) : (
                        materialAggregates.byCategory.map((c) => (
                          <TableRow
                            key={c.category_id || "uncat"}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium whitespace-nowrap">
                              <div>{c.category_name_ar}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatNum(c.required_orders)} /{" "}
                                {formatNum(c.consumed_orders)} أمر
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-amber-700 font-semibold">
                              {c.required_kg > 0
                                ? formatKg(c.required_kg)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-center text-green-700 font-semibold">
                              {c.consumed_kg > 0
                                ? formatKg(c.consumed_kg)
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    حسب اللون
                    <Badge variant="secondary">
                      {materialAggregates.byColor.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold whitespace-nowrap">
                          اللون
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          مطلوب
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialAggregates.byColor.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center py-8 text-muted-foreground"
                          >
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      ) : (
                        materialAggregates.byColor.map((c) => (
                          <TableRow
                            key={c.master_batch}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-border shrink-0"
                                  style={{ backgroundColor: c.color_hex }}
                                />
                                <span>{c.color_name_ar}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {formatNum(c.required_orders)} أمر
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-amber-700 font-semibold">
                              {c.required_kg > 0
                                ? formatKg(c.required_kg)
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
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
