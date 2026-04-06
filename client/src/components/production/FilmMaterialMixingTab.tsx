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
import { Beaker, Plus, Trash2, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  hex_color: string;
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
      if (!c.code) return false;
      if (c.code.toUpperCase() === normalizedCode) return true;
      if (c.aliases) {
        const aliasArr = c.aliases.split(",").map((a) => a.trim().toUpperCase());
        return aliasArr.includes(normalizedCode);
      }
      return false;
    });
    return colorData ? `${colorData.name_ar} (${colorData.code})` : code;
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
        <CardHeader>
          <CardTitle>{t("production.mixing.batchesLog")}</CardTitle>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t("production.mixing.batchNumber")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.productionOrder")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.machine")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.screw")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.totalWeightLabel")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.date")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.operator")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.composition")}</TableHead>
                    <TableHead className="text-right">{t("production.mixing.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const operator = users.find((u: any) => u.id === batch.operator_id);
                    return (
                      <TableRow
                        key={batch.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        data-testid={`row-batch-${batch.id}`}
                      >
                        <TableCell className="font-medium">
                          {batch.batch_number}
                        </TableCell>
                        <TableCell>
                          {batch.production_order_number || `PO-${batch.production_order_id}`}
                        </TableCell>
                        <TableCell>
                          {batch.machine_name_ar || batch.machine_name || batch.machine_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.screw_assignment}</Badge>
                        </TableCell>
                        <TableCell>{parseFloat(batch.total_weight_kg).toFixed(2)} {t("production.mixing.kg")}</TableCell>
                        <TableCell>
                          {new Date(batch.created_at).toLocaleDateString("en-US")}
                        </TableCell>
                        <TableCell>
                          {operator?.display_name_ar || operator?.display_name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            {batch.composition && batch.composition.length > 0 ? (
                              batch.composition.map((comp: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-medium">{comp.material_name_ar || comp.material_name}</span>
                                  <span className="text-muted-foreground"> ({comp.percentage})</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBatchDetails(batch)}
                            data-testid={`button-view-${batch.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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