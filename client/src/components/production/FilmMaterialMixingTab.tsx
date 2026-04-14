import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocalizedName } from "../../hooks/use-localized-name";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Beaker, Plus, Trash2, Eye, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "../../hooks/use-auth";
import { Progress } from "../ui/progress";

type Material = {
  id: string;
  item_id: string;
  item_name: string;
  item_name_ar: string;
  weight_kg: string;
  percentage: number;
};

type BatchDetail = {
  id: number;
  batch_number: string;
  production_order_id: number;
  production_order_number?: string;
  machine_id: string;
  machine_name?: string;
  machine_name_ar?: string;
  screw_assignment: string;
  operator_id: number;
  operator_name?: string;
  total_weight_kg: string;
  status: string;
  created_at: string;
  notes?: string;
  composition?: Array<{
    material_name?: string;
    material_name_ar?: string;
    percentage: string;
  }>;
  ingredients?: Array<{
    item_id: string;
    item_name?: string;
    item_name_ar?: string;
    actual_weight_kg: string;
    percentage: string;
  }>;
};

interface MasterBatchColor {
  id: string;
  name: string;
  name_ar: string;
  color_hex: string;
  aliases?: string;
}

export default function FilmMaterialMixingTab() {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [productionOrderId, setProductionOrderId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [screw, setScrew] = useState("A");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: masterBatchColors = [] } = useQuery<MasterBatchColor[]>({
    queryKey: ["/api/master-batch-colors"],
    queryFn: async () => {
      const response = await fetch("/api/master-batch-colors");
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || result || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getMasterBatchText = (code: string | null | undefined): string => {
    if (!code) return '';
    const normalizedCode = code.toUpperCase().trim();
    const colorData = masterBatchColors.find((c) => {
      if (String(c.id).toUpperCase() === normalizedCode) return true;
      if (c.aliases) {
        const aliasArr = c.aliases.split(",").map((a) => a.trim().toUpperCase());
        return aliasArr.includes(normalizedCode);
      }
      return false;
    });
    return colorData ? colorData.name_ar : code;
  };

  const { data: productionOrdersData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/production-orders"],
  });
  
  const allProductionOrders = Array.isArray(productionOrdersData) 
    ? productionOrdersData 
    : (productionOrdersData?.data || []);
  const productionOrders = allProductionOrders.filter(
    (po: any) => po.status === 'in_production' || po.status === 'pending'
  );

  const { data: machinesData, isLoading: machinesLoading } = useQuery<any>({
    queryKey: ["/api/machines"],
  });
  
  const allMachines = Array.isArray(machinesData)
    ? machinesData
    : (machinesData?.data || []);
  const machines = allMachines.filter(
    (machine: any) => machine.type === 'extruder'
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<any>({
    queryKey: ["/api/items"],
  });
  const rawMaterials = (itemsData?.data || itemsData || []).filter(
    (item: any) => item.category_id === "CAT10"
  );

  const { data: batchesData, isLoading: batchesLoading } = useQuery<{ data: BatchDetail[] }>({
    queryKey: ["/api/mixing-batches"],
  });
  const batches = batchesData?.data || [];

  const { data: usersData } = useQuery<any>({ queryKey: ["/api/users"] });
  const users = usersData?.data || usersData || [];

  const { data: poBatchesData } = useQuery<{ data: any[]; summary: { totalMixedA: number; totalMixedB: number; totalMixed: number } }>({
    queryKey: ["/api/mixing-batches/production-order", productionOrderId],
    queryFn: async () => {
      if (!productionOrderId) return { data: [], summary: { totalMixedA: 0, totalMixedB: 0, totalMixed: 0 } };
      const response = await fetch(`/api/mixing-batches/production-order/${productionOrderId}`, { credentials: 'include' });
      if (!response.ok) return { data: [], summary: { totalMixedA: 0, totalMixedB: 0, totalMixed: 0 } };
      return response.json();
    },
    enabled: !!productionOrderId,
  });

  const selectedOrder = useMemo(() => {
    if (!productionOrderId) return null;
    return productionOrders.find((po: any) => po.id.toString() === productionOrderId) || null;
  }, [productionOrderId, productionOrders]);

  const orderQuantity = useMemo(() => {
    if (!selectedOrder) return 0;
    return parseFloat(selectedOrder.final_quantity_kg || selectedOrder.quantity_kg || 0);
  }, [selectedOrder]);

  const previouslyMixed = poBatchesData?.summary?.totalMixed || 0;
  const previouslyMixedA = poBatchesData?.summary?.totalMixedA || 0;
  const previouslyMixedB = poBatchesData?.summary?.totalMixedB || 0;

  const totalWeight = materials.reduce(
    (sum, m) => sum + (parseFloat(m.weight_kg) || 0),
    0
  );

  const remainingQuantity = orderQuantity - previouslyMixed - totalWeight;
  const mixingProgress = orderQuantity > 0 ? ((previouslyMixed + totalWeight) / orderQuantity) * 100 : 0;
  const isOverLimit = remainingQuantity < 0;

  const updatePercentages = (mats: Material[]) => {
    const total = mats.reduce((sum, m) => sum + (parseFloat(m.weight_kg) || 0), 0);
    return mats.map(m => ({
      ...m,
      percentage: total > 0 ? (parseFloat(m.weight_kg) / total) * 100 : 0
    }));
  };

  const addMaterial = () => {
    if (materials.length >= 10) {
      toast({
        title: t("production.mixing.warning"),
        description: t("production.mixing.maxMaterials"),
        variant: "destructive",
      });
      return;
    }
    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      item_id: "",
      item_name: "",
      item_name_ar: "",
      weight_kg: "",
      percentage: 0,
    };
    setMaterials([...materials, newMaterial]);
  };

  const removeMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updatePercentages(updated));
  };

  const updateMaterialItem = (id: string, itemId: string) => {
    const item = rawMaterials.find((i: any) => i.id === itemId);
    const updated = materials.map(m =>
      m.id === id
        ? {
            ...m,
            item_id: itemId,
            item_name: item?.name || "",
            item_name_ar: item?.name_ar || "",
          }
        : m
    );
    setMaterials(updated);
  };

  const updateMaterialWeight = (id: string, weight: string) => {
    const updated = materials.map(m => (m.id === id ? { ...m, weight_kg: weight } : m));
    setMaterials(updatePercentages(updated));
  };

  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/mixing-batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t("production.mixing.saveSuccess"),
        description: t("production.mixing.batchCreated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-batches/production-order", productionOrderId] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("production.mixing.error"),
        description: error.message || t("production.mixing.batchCreateFailed"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setProductionOrderId("");
    setMachineId("");
    setScrew("A");
    setMaterials([]);
  };

  const handleSave = () => {
    if (!productionOrderId) {
      toast({ title: t("production.mixing.error"), description: t("production.mixing.selectProductionOrder"), variant: "destructive" });
      return;
    }
    if (!machineId) {
      toast({ title: t("production.mixing.error"), description: t("production.mixing.selectMachine"), variant: "destructive" });
      return;
    }
    if (materials.length === 0) {
      toast({ title: t("production.mixing.error"), description: t("production.mixing.addAtLeastOneMaterial"), variant: "destructive" });
      return;
    }
    if (materials.some(m => !m.item_id || !m.weight_kg || parseFloat(m.weight_kg) <= 0)) {
      toast({ title: t("production.mixing.error"), description: t("production.mixing.checkMaterialData"), variant: "destructive" });
      return;
    }

    if (isOverLimit) {
      toast({
        title: t("production.mixing.error"),
        description: "مجموع كميات الخلط يتجاوز الكمية المطلوبة في أمر الإنتاج",
        variant: "destructive",
      });
      return;
    }

    const batch = {
      production_order_id: parseInt(productionOrderId),
      machine_id: machineId,
      screw_assignment: screw,
      operator_id: user?.id || 1,
      total_weight_kg: totalWeight.toString(),
      status: "completed",
    };

    const ingredients = materials.map(m => ({
      item_id: m.item_id,
      actual_weight_kg: m.weight_kg,
      percentage: m.percentage.toFixed(2),
    }));

    createBatchMutation.mutate({ batch, ingredients });
  };

  const viewBatchDetails = (batch: BatchDetail) => {
    setSelectedBatch(batch);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            {t("production.mixing.createNewBatch")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("production.mixing.productionOrder")}</Label>
              {ordersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={productionOrderId} onValueChange={(val) => { setProductionOrderId(val); setMaterials([]); }}>
                  <SelectTrigger data-testid="select-production-order" className="min-w-[320px]">
                    <SelectValue placeholder={t("production.mixing.selectProductionOrder")} />
                  </SelectTrigger>
                  <SelectContent className="min-w-[480px] max-h-[400px]">
                    {productionOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        <div className="flex flex-col gap-0.5 py-1">
                          <div className="font-bold text-sm">{order.production_order_number}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {ln(order.customer_name_ar, order.customer_name)}
                            {' | '}{ln(order.item_name_ar, order.item_name)}
                            {order.raw_material && ` | ${order.raw_material}`}
                            {order.master_batch_id && ` | ${getMasterBatchText(order.master_batch_id)}`}
                            {' | '}{parseFloat(order.final_quantity_kg || order.quantity_kg || 0).toFixed(1)} كغ
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("production.mixing.filmMachine")}</Label>
              {machinesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={machineId} onValueChange={setMachineId}>
                  <SelectTrigger data-testid="select-machine">
                    <SelectValue placeholder={t("production.mixing.selectMachine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine: any) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name_ar || machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("production.mixing.screw")}</Label>
              <RadioGroup value={screw} onValueChange={setScrew}>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="A" id="screw-a" data-testid="radio-screw-a" />
                    <Label htmlFor="screw-a">A</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="B" id="screw-b" data-testid="radio-screw-b" />
                    <Label htmlFor="screw-b">B</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {selectedOrder && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">العميل:</span>
                    <p className="font-semibold">{ln(selectedOrder.customer_name_ar, selectedOrder.customer_name)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المنتج:</span>
                    <p className="font-semibold">{ln(selectedOrder.item_name_ar, selectedOrder.item_name) || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المادة الخام:</span>
                    <p className="font-semibold">{selectedOrder.raw_material || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">لون الماستر باتش:</span>
                    <p className="font-semibold">{selectedOrder.master_batch_id ? getMasterBatchText(selectedOrder.master_batch_id) : '-'}</p>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">الكمية الإجمالية:</span>
                      <p className="font-bold text-base">{orderQuantity.toFixed(2)} كغ</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المخلوط سابقاً (A+B):</span>
                      <p className="font-semibold">
                        {previouslyMixed.toFixed(2)} كغ
                        <span className="text-xs text-muted-foreground mr-1">
                          (A: {previouslyMixedA.toFixed(1)} | B: {previouslyMixedB.toFixed(1)})
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الخلطة الحالية:</span>
                      <p className="font-semibold">{totalWeight.toFixed(2)} كغ</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المتبقي:</span>
                      <p className={`font-bold text-base ${isOverLimit ? 'text-red-600' : remainingQuantity <= 0 ? 'text-green-600' : ''}`}>
                        {remainingQuantity.toFixed(2)} كغ
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>نسبة اكتمال الخلط</span>
                      <span className={isOverLimit ? 'text-red-600 font-bold' : ''}>
                        {Math.min(mixingProgress, 100).toFixed(1)}%
                        {isOverLimit && ' (تجاوز!)'}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(mixingProgress, 100)}
                      className={`h-3 ${isOverLimit ? '[&>div]:bg-red-500' : mixingProgress >= 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`}
                    />
                  </div>
                  {isOverLimit && (
                    <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 dark:bg-red-950/50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>مجموع كميات الخلط يتجاوز الكمية المطلوبة بـ {Math.abs(remainingQuantity).toFixed(2)} كغ</span>
                    </div>
                  )}
                  {!isOverLimit && remainingQuantity <= 0 && previouslyMixed > 0 && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 dark:bg-green-950/50 p-2 rounded">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>تم اكتمال خلط كامل الكمية المطلوبة</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">{t("production.mixing.rawMaterials")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
                data-testid="button-add-material"
              >
                <Plus className="h-4 w-4 ml-2" />
                {t("production.mixing.addMaterial")}
              </Button>
            </div>

            {materials.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t("production.mixing.noMaterials")}
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <div
                    key={material.id}
                    className="grid grid-cols-12 gap-2 items-end"
                    data-testid={`material-row-${index}`}
                  >
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">{t("production.mixing.material")}</Label>
                      {itemsLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={material.item_id}
                          onValueChange={(val) => updateMaterialItem(material.id, val)}
                        >
                          <SelectTrigger data-testid={`select-material-${index}`}>
                            <SelectValue placeholder={t("production.mixing.selectMaterial")} />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name_ar || item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">{t("production.mixing.weightKg")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={material.weight_kg}
                        onChange={(e) => updateMaterialWeight(material.id, e.target.value)}
                        placeholder="0.00"
                        data-testid={`input-weight-${index}`}
                      />
                    </div>

                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">{t("production.mixing.percentage")}</Label>
                      <Input
                        type="text"
                        value={material.percentage.toFixed(2) + "%"}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                        data-testid={`text-percentage-${index}`}
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeMaterial(material.id)}
                        data-testid={`button-remove-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {materials.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t("production.mixing.totalWeight")}:</span>
                  <span data-testid="text-total-weight">{totalWeight.toFixed(2)} {t("production.mixing.kg")}</span>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={createBatchMutation.isPending || isOverLimit}
            className="w-full"
            data-testid="button-save-batch"
          >
            {createBatchMutation.isPending ? t("production.mixing.saving") : t("production.mixing.saveBatch")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("production.mixing.batchesLog")}</CardTitle>
          {batches.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="print:hidden"
              onClick={() => {
                const printArea = document.getElementById("mixing-batches-print-area");
                if (!printArea) return;
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                printWindow.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>سجل الخلطات</title><style>
                  @page { size: A4 landscape; margin: 10mm; }
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body { font-family: 'Cairo','Segoe UI',Tahoma,sans-serif; direction: rtl; font-size: 11px; color: #000; }
                  .print-container { width: 277mm; padding: 5mm; }
                  .print-title { text-align: center; font-size: 18px; font-weight: 900; margin-bottom: 8px; }
                  .print-date { text-align: center; font-size: 11px; color: #666; margin-bottom: 12px; }
                  .tables-wrapper { display: flex; gap: 8mm; width: 100%; }
                  .screw-section { flex: 1; min-width: 0; }
                  .screw-title { text-align: center; font-size: 14px; font-weight: 800; padding: 4px 0; margin-bottom: 4px; border: 2px solid #333; background: #f0f0f0; }
                  table { width: 100%; border-collapse: collapse; font-size: 10px; }
                  th { background: #e8e8e8; font-weight: 700; padding: 3px 4px; border: 1px solid #999; text-align: right; white-space: nowrap; }
                  td { padding: 2px 4px; border: 1px solid #ccc; text-align: right; vertical-align: top; }
                  tr:nth-child(even) { background: #f8f8f8; }
                  .comp-item { font-size: 9px; line-height: 1.3; }
                  .total-row { font-weight: 800; background: #e0e0e0 !important; font-size: 11px; }
                </style></head><body>`);
                printWindow.document.write(printArea.innerHTML);
                printWindow.document.write("</body></html>");
                printWindow.document.close();
                printWindow.onload = () => { printWindow.print(); };
              }}
            >
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("production.mixing.noBatches")}
            </p>
          ) : (
            <>
              <div id="mixing-batches-print-area" style={{ display: "none" }}>
                <div className="print-container">
                  <div className="print-title">سجل الخلطات</div>
                  <div className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
                  <div className="tables-wrapper">
                    <div className="screw-section">
                      <div className="screw-title">سكرو A</div>
                      <table>
                        <thead>
                          <tr>
                            <th>رقم الخلطة</th>
                            <th>أمر الإنتاج</th>
                            <th>الماكينة</th>
                            <th>الوزن (كغ)</th>
                            <th>التاريخ</th>
                            <th>المشغل</th>
                            <th>التركيبة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batches.filter(b => b.screw_assignment === "A").map((batch) => {
                            const operator = users.find((u: any) => u.id === batch.operator_id);
                            return (
                              <tr key={batch.id}>
                                <td>{batch.batch_number}</td>
                                <td>{batch.production_order_number || `PO-${batch.production_order_id}`}</td>
                                <td>{batch.machine_name_ar || batch.machine_name || batch.machine_id}</td>
                                <td>{parseFloat(batch.total_weight_kg).toFixed(2)}</td>
                                <td>{new Date(batch.created_at).toLocaleDateString("en-US")}</td>
                                <td>{operator?.display_name_ar || operator?.display_name || "-"}</td>
                                <td>
                                  {batch.composition && batch.composition.length > 0
                                    ? batch.composition.map((comp: any, idx: number) => (
                                        <div key={idx} className="comp-item">{comp.material_name_ar || comp.material_name} ({comp.percentage})</div>
                                      ))
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="total-row">
                            <td colSpan={3}>المجموع</td>
                            <td>{batches.filter(b => b.screw_assignment === "A").reduce((s, b) => s + parseFloat(b.total_weight_kg), 0).toFixed(2)} كغ</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="screw-section">
                      <div className="screw-title">سكرو B</div>
                      <table>
                        <thead>
                          <tr>
                            <th>رقم الخلطة</th>
                            <th>أمر الإنتاج</th>
                            <th>الماكينة</th>
                            <th>الوزن (كغ)</th>
                            <th>التاريخ</th>
                            <th>المشغل</th>
                            <th>التركيبة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batches.filter(b => b.screw_assignment === "B").map((batch) => {
                            const operator = users.find((u: any) => u.id === batch.operator_id);
                            return (
                              <tr key={batch.id}>
                                <td>{batch.batch_number}</td>
                                <td>{batch.production_order_number || `PO-${batch.production_order_id}`}</td>
                                <td>{batch.machine_name_ar || batch.machine_name || batch.machine_id}</td>
                                <td>{parseFloat(batch.total_weight_kg).toFixed(2)}</td>
                                <td>{new Date(batch.created_at).toLocaleDateString("en-US")}</td>
                                <td>{operator?.display_name_ar || operator?.display_name || "-"}</td>
                                <td>
                                  {batch.composition && batch.composition.length > 0
                                    ? batch.composition.map((comp: any, idx: number) => (
                                        <div key={idx} className="comp-item">{comp.material_name_ar || comp.material_name} ({comp.percentage})</div>
                                      ))
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="total-row">
                            <td colSpan={3}>المجموع</td>
                            <td>{batches.filter(b => b.screw_assignment === "B").reduce((s, b) => s + parseFloat(b.total_weight_kg), 0).toFixed(2)} كغ</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[
                  { screw: "A", color: "blue", label: "سكرو A", borderColor: "border-blue-400 dark:border-blue-600", headerBg: "bg-blue-600 dark:bg-blue-700", headerText: "text-white", totalBg: "bg-blue-50 dark:bg-blue-950/50", hoverBg: "hover:bg-blue-50/50 dark:hover:bg-blue-950/30" },
                  { screw: "B", color: "emerald", label: "سكرو B", borderColor: "border-emerald-400 dark:border-emerald-600", headerBg: "bg-emerald-600 dark:bg-emerald-700", headerText: "text-white", totalBg: "bg-emerald-50 dark:bg-emerald-950/50", hoverBg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30" },
                ].map(({ screw, label, borderColor, headerBg, headerText, totalBg, hoverBg }) => {
                  const screwBatches = batches.filter(b => b.screw_assignment === screw);
                  const screwTotal = screwBatches.reduce((s, b) => s + parseFloat(b.total_weight_kg), 0);
                  return (
                    <div key={screw} className={`border-2 ${borderColor} rounded-lg overflow-hidden shadow-sm`}>
                      <div className={`${headerBg} ${headerText} text-center py-2.5 font-bold text-base`}>
                        {label}
                        <span className="text-sm font-normal mr-2 opacity-90">({screwBatches.length} خلطة — {screwTotal.toFixed(2)} كغ)</span>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">رقم الخلطة</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">أمر الإنتاج</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">الماكينة</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">الوزن</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">التاريخ</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">المشغل</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-2">التركيبة</TableHead>
                              <TableHead className="text-right text-xs font-bold whitespace-nowrap px-1 w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {screwBatches.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-6 text-sm">لا توجد خلطات للـ {label}</TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {screwBatches.map((batch, index) => {
                                  const operator = users.find((u: any) => u.id === batch.operator_id);
                                  return (
                                    <TableRow key={batch.id} className={`${hoverBg} cursor-pointer text-xs ${index % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`} data-testid={`row-batch-${batch.id}`}>
                                      <TableCell className="font-semibold px-2 py-1.5">{batch.batch_number}</TableCell>
                                      <TableCell className="px-2 py-1.5">{batch.production_order_number || `PO-${batch.production_order_id}`}</TableCell>
                                      <TableCell className="px-2 py-1.5">{batch.machine_name_ar || batch.machine_name || batch.machine_id}</TableCell>
                                      <TableCell className="px-2 py-1.5 font-medium">{parseFloat(batch.total_weight_kg).toFixed(2)}</TableCell>
                                      <TableCell className="px-2 py-1.5" dir="ltr">{new Date(batch.created_at).toLocaleDateString("en-US")}</TableCell>
                                      <TableCell className="px-2 py-1.5">{operator?.display_name_ar || operator?.display_name || "-"}</TableCell>
                                      <TableCell className="px-2 py-1.5">
                                        <div className="space-y-0.5">
                                          {batch.composition && batch.composition.length > 0 ? (
                                            batch.composition.map((comp: any, idx: number) => (
                                              <div key={idx} className="text-[10px] leading-tight">
                                                <span className="font-medium">{comp.material_name_ar || comp.material_name}</span>
                                                <span className="text-muted-foreground"> ({comp.percentage})</span>
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="px-1 py-1.5">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewBatchDetails(batch)} data-testid={`button-view-${batch.id}`}>
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow className={`${totalBg} border-t-2`}>
                                  <TableCell colSpan={3} className="text-right font-bold px-2 py-2">المجموع</TableCell>
                                  <TableCell className="font-bold px-2 py-2">{screwTotal.toFixed(2)} كغ</TableCell>
                                  <TableCell colSpan={4}></TableCell>
                                </TableRow>
                              </>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t("production.mixing.batchDetails")}</DialogTitle>
            <DialogDescription className="sr-only">{t("production.mixing.batchDetailsDescription")}</DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.batchNumber")}</Label>
                  <p className="font-semibold">{selectedBatch.batch_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.productionOrder")}</Label>
                  <p className="font-semibold">
                    {selectedBatch.production_order_number || `PO-${selectedBatch.production_order_id}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.machine")}</Label>
                  <p className="font-semibold">
                    {selectedBatch.machine_name_ar || selectedBatch.machine_name || selectedBatch.machine_id}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.screw")}</Label>
                  <p className="font-semibold">{selectedBatch.screw_assignment}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.totalWeightLabel")}</Label>
                  <p className="font-semibold">{parseFloat(selectedBatch.total_weight_kg).toFixed(2)} {t("production.mixing.kg")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.date")}</Label>
                  <p className="font-semibold">
                    {new Date(selectedBatch.created_at).toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              {selectedBatch.ingredients && selectedBatch.ingredients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">{t("production.mixing.ingredients")}</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">{t("production.mixing.material")}</TableHead>
                        <TableHead className="text-right">{t("production.mixing.weightKg")}</TableHead>
                        <TableHead className="text-right">{t("production.mixing.percentage")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBatch.ingredients.map((ing, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{ln(ing.item_name_ar, ing.item_name) || ing.item_id}</TableCell>
                          <TableCell>{parseFloat(ing.actual_weight_kg).toFixed(2)}</TableCell>
                          <TableCell>{parseFloat(ing.percentage).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedBatch.notes && (
                <div>
                  <Label className="text-muted-foreground">{t("production.mixing.notes")}</Label>
                  <p className="font-medium">{selectedBatch.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}