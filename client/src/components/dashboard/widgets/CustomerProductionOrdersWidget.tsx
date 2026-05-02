import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User,
  Calendar,
  Package,
  Factory,
  ChevronDown,
  ChevronRight,
  Layers,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../../lib/formatNumber";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { ScrollArea } from "../../ui/scroll-area";
import {
  SearchableSelect,
  SearchableSelectOption,
} from "../../ui/searchable-select";
import { Skeleton } from "../../ui/skeleton";

interface Customer {
  id: string;
  name?: string;
  name_ar?: string;
}

interface ProductionOrder {
  id: number;
  production_order_number?: string;
  order_id?: number;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_name_ar?: string;
  status?: string;
  quantity_kg?: string | number;
  final_quantity_kg?: string | number;
  produced_quantity_kg?: string | number;
  film_completion_percentage?: string | number;
  printing_completion_percentage?: string | number;
  cutting_completion_percentage?: string | number;
  size_caption?: string;
  is_printed?: boolean;
  item_name?: string;
  item_name_ar?: string;
  production_start_time?: string | null;
  production_end_time?: string | null;
}

interface OrderGroup {
  orderKey: string;
  orderNumber: string;
  orderDate: Date | null;
  totalFinalQty: number;
  totalProducedQty: number;
  productionOrders: ProductionOrder[];
}

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (date: Date | null, locale: string): string => {
  if (!date) return "—";
  try {
    return date.toLocaleDateString(locale === "ar" ? "ar" : "en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

export default function CustomerProductionOrdersWidget() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );

  const { data: customersData, isLoading: customersLoading } = useQuery<
    Customer[] | { data: Customer[] }
  >({
    queryKey: ["/api/customers"],
  });

  const customers: Customer[] = useMemo(() => {
    if (Array.isArray(customersData)) return customersData;
    if (
      customersData &&
      typeof customersData === "object" &&
      "data" in customersData &&
      Array.isArray(customersData.data)
    ) {
      return customersData.data;
    }
    return [];
  }, [customersData]);

  const {
    data: prodOrdersData,
    isLoading: prodOrdersLoading,
    isError: prodOrdersError,
  } = useQuery<ProductionOrder[]>({
    queryKey: [
      "/api/production-orders",
      { customer_id: selectedCustomerId },
    ],
    enabled: !!selectedCustomerId,
  });

  const productionOrders: ProductionOrder[] = useMemo(
    () => (Array.isArray(prodOrdersData) ? prodOrdersData : []),
    [prodOrdersData],
  );

  const customerOptions: SearchableSelectOption[] = useMemo(() => {
    return customers
      .map((c) => {
        const label = isArabic
          ? c.name_ar || c.name || c.id
          : c.name || c.name_ar || c.id;
        return {
          value: String(c.id),
          label: `${label} (${c.id})`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, isArabic ? "ar" : "en"));
  }, [customers, isArabic]);

  const filteredOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return productionOrders.filter(
      (po) => String(po.customer_id ?? "") === selectedCustomerId,
    );
  }, [productionOrders, selectedCustomerId]);

  const orderGroups: OrderGroup[] = useMemo(() => {
    const map = new Map<string, OrderGroup>();
    for (const po of filteredOrders) {
      const orderKey =
        po.order_number ||
        (po.order_id !== undefined ? `#${po.order_id}` : `po-${po.id}`);
      const existing = map.get(orderKey);
      const startDate = po.production_start_time
        ? new Date(po.production_start_time)
        : null;
      if (!existing) {
        map.set(orderKey, {
          orderKey,
          orderNumber: po.order_number || orderKey,
          orderDate: startDate,
          totalFinalQty: toNumber(po.final_quantity_kg),
          totalProducedQty: toNumber(po.produced_quantity_kg),
          productionOrders: [po],
        });
      } else {
        existing.productionOrders.push(po);
        existing.totalFinalQty += toNumber(po.final_quantity_kg);
        existing.totalProducedQty += toNumber(po.produced_quantity_kg);
        if (
          startDate &&
          (!existing.orderDate || startDate > existing.orderDate)
        ) {
          existing.orderDate = startDate;
        }
      }
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      const at = a.orderDate ? a.orderDate.getTime() : 0;
      const bt = b.orderDate ? b.orderDate.getTime() : 0;
      if (bt !== at) return bt - at;
      return b.orderKey.localeCompare(a.orderKey);
    });
    return groups;
  }, [filteredOrders]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
            {isArabic ? "مكتمل" : "Completed"}
          </Badge>
        );
      case "active":
      case "in_production":
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
            {isArabic ? "قيد الإنتاج" : "In Production"}
          </Badge>
        );
      case "pending":
      case "new":
      case "waiting":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs">
            {isArabic ? "معلق" : "Pending"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
            {isArabic ? "ملغى" : "Cancelled"}
          </Badge>
        );
      case "on_hold":
      case "paused":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 text-xs">
            {isArabic ? "متوقف" : "On Hold"}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status || "—"}
          </Badge>
        );
    }
  };

  const overallCompletion = (po: ProductionOrder): number => {
    const film = toNumber(po.film_completion_percentage);
    const printing = toNumber(po.printing_completion_percentage);
    const cutting = toNumber(po.cutting_completion_percentage);
    const stages = po.is_printed ? [film, printing, cutting] : [film, cutting];
    const sum = stages.reduce((a, b) => a + b, 0);
    const avg = sum / stages.length;
    return Math.max(0, Math.min(100, Math.round(avg)));
  };

  const toggleOrder = (orderKey: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderKey]: !prev[orderKey] }));
  };

  const isLoading = customersLoading || prodOrdersLoading;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            {isArabic
              ? "أوامر إنتاج العميل"
              : "Customer Production Orders"}
          </CardTitle>
          {selectedCustomerId && filteredOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {formatNumber(orderGroups.length)}{" "}
                {isArabic ? "طلب" : "orders"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatNumber(filteredOrders.length)}{" "}
                {isArabic ? "أمر إنتاج" : "POs"}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          {customersLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SearchableSelect
              options={customerOptions}
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
              placeholder={
                isArabic ? "ابحث عن عميل..." : "Search for a customer..."
              }
              searchPlaceholder={
                isArabic
                  ? "اكتب اسم العميل أو رقمه..."
                  : "Type a customer name or ID..."
              }
              emptyText={isArabic ? "لا يوجد عملاء" : "No customers found"}
            />
          )}
        </div>

        {!selectedCustomerId ? (
          <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-lg">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>
              {isArabic
                ? "اختر عميلاً لعرض أوامر الإنتاج الخاصة به"
                : "Select a customer to view their production orders"}
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : prodOrdersError ? (
          <div className="text-center py-10 text-sm text-red-600 dark:text-red-400 border border-dashed border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-900/10">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>
              {isArabic
                ? "تعذر تحميل أوامر الإنتاج. حاول مرة أخرى."
                : "Could not load production orders. Please try again."}
            </p>
          </div>
        ) : orderGroups.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-lg">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>
              {isArabic
                ? "لا توجد أوامر إنتاج لهذا العميل"
                : "No production orders for this customer"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[420px] pr-1">
            <div className="space-y-2">
              {orderGroups.map((group) => {
                const isExpanded = expandedOrders[group.orderKey] !== false;
                const groupCompletion =
                  group.totalFinalQty > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (group.totalProducedQty / group.totalFinalQty) * 100,
                        ),
                      )
                    : 0;
                return (
                  <div
                    key={group.orderKey}
                    className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900"
                  >
                    <button
                      type="button"
                      onClick={() => toggleOrder(group.orderKey)}
                      className="w-full flex items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                        <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-sm truncate">
                          {group.orderNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatNumber(group.productionOrders.length)}{" "}
                          {isArabic ? "أمر" : "POs"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(group.orderDate, i18n.language)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {formatNumber(group.totalFinalQty)}{" "}
                          {isArabic ? "كجم" : "kg"}
                        </span>
                      </div>
                    </button>

                    {group.totalFinalQty > 0 && (
                      <div className="px-3 pb-2">
                        <Progress
                          value={groupCompletion}
                          className="h-1.5"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <span>
                            {formatNumber(group.totalProducedQty)} /{" "}
                            {formatNumber(group.totalFinalQty)}{" "}
                            {isArabic ? "كجم" : "kg"}
                          </span>
                          <span>{groupCompletion}%</span>
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t bg-gray-50/60 dark:bg-gray-800/40 divide-y dark:divide-gray-700/60">
                        {group.productionOrders.map((po) => {
                          const completion = overallCompletion(po);
                          const itemName = isArabic
                            ? po.item_name_ar || po.item_name
                            : po.item_name || po.item_name_ar;
                          return (
                            <div
                              key={po.id}
                              className="p-2.5 hover:bg-white dark:hover:bg-gray-900/60 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Factory className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="text-xs font-medium truncate">
                                    {po.production_order_number || `#${po.id}`}
                                  </span>
                                  {getStatusBadge(po.status)}
                                </div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">
                                  {formatNumber(po.final_quantity_kg)}{" "}
                                  <span className="text-gray-400 font-normal">
                                    {isArabic ? "كجم" : "kg"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                <span className="truncate">
                                  {itemName || "—"}
                                  {po.size_caption ? ` · ${po.size_caption}` : ""}
                                </span>
                                <span className="shrink-0 font-medium">
                                  {completion}%
                                </span>
                              </div>
                              <Progress
                                value={completion}
                                className="h-1 mt-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
