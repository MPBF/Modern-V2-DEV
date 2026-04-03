import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronLeft, Package, FileText, CircleDot, Search, User, Filter } from "lucide-react";

interface Roll {
  id: number;
  roll_number: string;
  production_order_id: number;
  stage: string;
  weight_kg: string | null;
  waste_kg: string | null;
  created_at: string;
}

interface ProductionOrder {
  id: number;
  order_id: number;
  production_order_number: string;
  quantity_kg: string | null;
  final_quantity_kg: string | null;
  produced_quantity_kg: string | null;
  film_completion_percentage: string | null;
  printing_completion_percentage: string | null;
  cutting_completion_percentage: string | null;
  status: string;
  rolls: Roll[];
}

interface Order {
  id: number;
  order_number: string;
  customer_id: string;
  customer_name: string | null;
  customer_name_ar: string | null;
  delivery_days: number | null;
  delivery_date: string | null;
  status: string;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  sales_rep_id: number | null;
  production_orders: ProductionOrder[];
}

interface SalesRepGroup {
  salesRep: {
    id: number;
    display_name: string;
    display_name_ar: string;
    username?: string;
  };
  orders: Order[];
}

const statusConfig: Record<string, { label: string; labelEn: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  waiting: { label: "في الانتظار", labelEn: "Waiting", variant: "secondary" },
  in_production: { label: "قيد الإنتاج", labelEn: "In Production", variant: "default" },
  completed: { label: "مكتمل", labelEn: "Completed", variant: "outline" },
  cancelled: { label: "ملغي", labelEn: "Cancelled", variant: "destructive" },
  paused: { label: "متوقف", labelEn: "Paused", variant: "secondary" },
};

const poStatusConfig: Record<string, { label: string; labelEn: string; color: string }> = {
  pending: { label: "معلق", labelEn: "Pending", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  active: { label: "نشط", labelEn: "Active", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  completed: { label: "مكتمل", labelEn: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  cancelled: { label: "ملغي", labelEn: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const stageConfig: Record<string, { label: string; labelEn: string; color: string }> = {
  film: { label: "فيلم", labelEn: "Film", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  printing: { label: "طباعة", labelEn: "Printing", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  cutting: { label: "تقطيع", labelEn: "Cutting", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  done: { label: "منتهي", labelEn: "Done", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="w-10 text-end text-muted-foreground">{value.toFixed(0)}%</span>
    </div>
  );
}

function RollsTable({ rolls, isAr }: { rolls: Roll[]; isAr: boolean }) {
  if (rolls.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2 px-4">
        {isAr ? "لا توجد رولات" : "No rolls"}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isAr ? "رقم الرول" : "Roll #"}</TableHead>
            <TableHead>{isAr ? "المرحلة" : "Stage"}</TableHead>
            <TableHead>{isAr ? "الوزن (كجم)" : "Weight (kg)"}</TableHead>
            <TableHead>{isAr ? "الهالك (كجم)" : "Waste (kg)"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rolls.map((roll) => {
            const stage = stageConfig[roll.stage] || { label: roll.stage, labelEn: roll.stage, color: "bg-gray-100 text-gray-800" };
            return (
              <TableRow key={roll.id}>
                <TableCell className="font-mono text-xs">{roll.roll_number}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>
                    {isAr ? stage.label : stage.labelEn}
                  </span>
                </TableCell>
                <TableCell>{roll.weight_kg || "-"}</TableCell>
                <TableCell>{roll.waste_kg || "-"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ProductionOrderCard({ po, isAr }: { po: ProductionOrder; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const poStatus = poStatusConfig[po.status] || { label: po.status, labelEn: po.status, color: "bg-gray-100 text-gray-800" };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card mb-2">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">{po.production_order_number}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${poStatus.color}`}>
                {isAr ? poStatus.label : poStatus.labelEn}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {isAr ? "رولات" : "Rolls"}: {po.rolls.length}
              </span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">{isAr ? "الكمية المطلوبة:" : "Required:"}</span>{" "}
                <span className="font-medium">{po.quantity_kg || "-"} {isAr ? "كجم" : "kg"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{isAr ? "الكمية النهائية:" : "Final:"}</span>{" "}
                <span className="font-medium">{po.final_quantity_kg || "-"} {isAr ? "كجم" : "kg"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{isAr ? "المنتج:" : "Produced:"}</span>{" "}
                <span className="font-medium">{po.produced_quantity_kg || "-"} {isAr ? "كجم" : "kg"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <ProgressBar
                value={parseFloat(po.film_completion_percentage || "0")}
                label={isAr ? "فيلم" : "Film"}
              />
              <ProgressBar
                value={parseFloat(po.printing_completion_percentage || "0")}
                label={isAr ? "طباعة" : "Print"}
              />
              <ProgressBar
                value={parseFloat(po.cutting_completion_percentage || "0")}
                label={isAr ? "تقطيع" : "Cut"}
              />
            </div>
            <RollsTable rolls={po.rolls} isAr={isAr} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function OrderCard({ order, isAr }: { order: Order; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const status = statusConfig[order.status] || { label: order.status, labelEn: order.status, variant: "secondary" as const };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card mb-3 shadow-sm">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div className="text-start">
                <div className="font-mono text-sm font-bold">{order.order_number}</div>
                <div className="text-xs text-muted-foreground">
                  {isAr ? (order.customer_name_ar || order.customer_name) : (order.customer_name || order.customer_name_ar)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={status.variant}>
                {isAr ? status.label : status.labelEn}
              </Badge>
              {order.delivery_date && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {new Date(order.delivery_date).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {isAr ? "أوامر إنتاج" : "POs"}: {order.production_orders.length}
              </span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-3 space-y-2">
            {order.notes && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {order.notes}
              </p>
            )}
            {order.production_orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا توجد أوامر إنتاج" : "No production orders"}
              </p>
            ) : (
              order.production_orders.map((po) => (
                <ProductionOrderCard key={po.id} po={po} isAr={isAr} />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function MyOrders() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedReps, setExpandedReps] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ success: boolean; data: SalesRepGroup[] }>({
    queryKey: ["/api/my-orders"],
  });

  const groups = data?.data || [];

  const filteredGroups = groups
    .map((group) => {
      const filtered = group.orders.filter((order) => {
        const matchSearch =
          !searchTerm ||
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customer_name_ar || "").includes(searchTerm);
        const matchStatus = statusFilter === "all" || order.status === statusFilter;
        return matchSearch && matchStatus;
      });
      return { ...group, orders: filtered };
    })
    .filter((group) => group.orders.length > 0);

  const toggleRep = (key: string) => {
    setExpandedReps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const totalOrders = filteredGroups.reduce((sum, g) => sum + g.orders.length, 0);
  const totalPOs = filteredGroups.reduce(
    (sum, g) => sum + g.orders.reduce((s, o) => s + o.production_orders.length, 0),
    0
  );
  const totalRolls = filteredGroups.reduce(
    (sum, g) =>
      sum +
      g.orders.reduce(
        (s, o) => s + o.production_orders.reduce((r, po) => r + po.rolls.length, 0),
        0
      ),
    0
  );

  return (
    <PageLayout title={isAr ? "طلباتي" : "My Orders"}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <div className="text-xs text-muted-foreground">{isAr ? "طلبات" : "Orders"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{totalPOs}</div>
                <div className="text-xs text-muted-foreground">{isAr ? "أوامر إنتاج" : "Production Orders"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CircleDot className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totalRolls}</div>
                <div className="text-xs text-muted-foreground">{isAr ? "رولات" : "Rolls"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالرقم أو اسم العميل..." : "Search by number or customer..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="waiting">{isAr ? "في الانتظار" : "Waiting"}</SelectItem>
              <SelectItem value="in_production">{isAr ? "قيد الإنتاج" : "In Production"}</SelectItem>
              <SelectItem value="completed">{isAr ? "مكتمل" : "Completed"}</SelectItem>
              <SelectItem value="cancelled">{isAr ? "ملغي" : "Cancelled"}</SelectItem>
              <SelectItem value="paused">{isAr ? "متوقف" : "Paused"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                {isAr ? "لا توجد طلبات" : "No orders found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "لم يتم العثور على طلبات مطابقة للبحث" : "No orders match your search criteria"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const key = String(group.salesRep.id);
            const isExpanded = expandedReps.has(key);
            const repName = isAr
              ? group.salesRep.display_name_ar || group.salesRep.display_name
              : group.salesRep.display_name || group.salesRep.display_name_ar;

            return (
              <Card key={key}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleRep(key)}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-start">
                            <CardTitle className="text-base">{repName}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {group.orders.length} {isAr ? "طلبات" : "orders"}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {group.orders.map((order) => (
                        <OrderCard key={order.id} order={order} isAr={isAr} />
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </PageLayout>
  );
}
