import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Factory,
  CheckCircle,
  Hash,
  User,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  Boxes,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Loader2,
  Sliders,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import PageLayout from "../components/layout/PageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { InventoryCountForm } from "../components/warehouse/InventoryCountForm";
import { VoucherForm } from "../components/warehouse/VoucherForm";
import { VouchersList } from "../components/warehouse/VouchersList";
import { WarehouseDefinitions } from "../components/warehouse/WarehouseDefinitions";
import { WarehouseReports } from "../components/warehouse/WarehouseReports";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useAuth } from "../hooks/use-auth";
import { useLocalizedName } from "../hooks/use-localized-name";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { userHasPermission } from "../utils/roleUtils";

export default function Warehouse() {
  const { t } = useTranslation();

  const [voucherFormType, setVoucherFormType] = useState<
    | "raw-material-in"
    | "raw-material-out"
    | "finished-goods-in"
    | "finished-goods-out"
  >("raw-material-in");
  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false);
  const [isInventoryCountOpen, setIsInventoryCountOpen] = useState(false);

  const openVoucherForm = (type: typeof voucherFormType) => {
    setVoucherFormType(type);
    setIsVoucherFormOpen(true);
  };

  const { data: voucherStats } = useQuery<{
    rm_in: number;
    rm_out: number;
    fp_in: number;
    fp_out: number;
    total: number;
  }>({
    queryKey: ["/api/warehouse/vouchers/stats"],
  });

  return (
    <PageLayout
      title={t("warehouse.title")}
      description={t("warehouse.description")}
    >
      <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
              {t("warehouse.dashboard.rawMaterialInVouchers")}
            </CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {voucherStats?.rm_in || 0}
            </div>
            <p className="text-xs text-muted-foreground">RM-Rec</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              {t("warehouse.dashboard.rawMaterialOutVouchers")}
            </CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {voucherStats?.rm_out || 0}
            </div>
            <p className="text-xs text-muted-foreground">RM-Del</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {t("warehouse.dashboard.finishedGoodsInVouchers")}
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {voucherStats?.fp_in || 0}
            </div>
            <p className="text-xs text-muted-foreground">FP-Rec</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
              {t("warehouse.dashboard.finishedGoodsOutVouchers")}
            </CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {voucherStats?.fp_out || 0}
            </div>
            <p className="text-xs text-muted-foreground">FP-Del</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="production-hall" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:inline-flex sm:flex-nowrap sm:h-10">
          <TabsTrigger
            value="production-hall"
            className="bg-amber-50 dark:bg-amber-950 text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <Factory className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.tabs.productionHall")}
          </TabsTrigger>
          <TabsTrigger
            value="finished-goods"
            className="bg-blue-50 dark:bg-blue-950 text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <Package className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.tabs.finishedGoods")}
          </TabsTrigger>
          <TabsTrigger
            value="raw-materials"
            className="bg-green-50 dark:bg-green-950 text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <Boxes className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.tabs.rawMaterials")}
          </TabsTrigger>
          <TabsTrigger
            value="definitions"
            className="bg-purple-50 dark:bg-purple-950 text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <Settings className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.tabs.definitions")}
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="bg-gray-50 dark:bg-gray-950 text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <BarChart3 className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.tabs.reports")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production-hall" className="space-y-4">
          <ProductionHallContent
            onCreateVoucher={() => openVoucherForm("finished-goods-in")}
          />
        </TabsContent>

        <TabsContent value="finished-goods" className="space-y-4">
          <FinishedGoodsSection
            onCreateVoucherIn={() => openVoucherForm("finished-goods-in")}
            onCreateVoucherOut={() => openVoucherForm("finished-goods-out")}
          />
        </TabsContent>

        <TabsContent value="raw-materials" className="space-y-4">
          <RawMaterialsSection
            onCreateVoucherIn={() => openVoucherForm("raw-material-in")}
            onCreateVoucherOut={() => openVoucherForm("raw-material-out")}
          />
        </TabsContent>

        <TabsContent value="definitions" className="space-y-4">
          <WarehouseDefinitions />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <WarehouseReports />
        </TabsContent>
      </Tabs>

      <VoucherForm
        type={voucherFormType}
        open={isVoucherFormOpen}
        onOpenChange={setIsVoucherFormOpen}
      />

      <InventoryCountForm
        open={isInventoryCountOpen}
        onOpenChange={setIsInventoryCountOpen}
      />
    </PageLayout>
  );
}

function FinishedGoodsSection({
  onCreateVoucherIn,
  onCreateVoucherOut,
}: {
  onCreateVoucherIn: () => void;
  onCreateVoucherOut: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="fp-del" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:inline-flex sm:flex-nowrap sm:h-10">
          <TabsTrigger
            value="fp-del"
            className="text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <Truck className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.production.fpDelVouchers")}
          </TabsTrigger>
          <TabsTrigger
            value="fp-rec"
            className="text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <ArrowDownToLine className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.production.fpRecVouchers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fp-del">
          <DeliveryHallContent />
        </TabsContent>
        <TabsContent value="fp-rec">
          <VouchersList
            type="finished-goods-in"
            title={t("warehouse.production.fpRecVouchersTitle")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeliveryHallContent() {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [deliveryWeights, setDeliveryWeights] = useState<
    Record<string, string>
  >({});
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedDeliveryOrderId, setSelectedDeliveryOrderId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: deliveryOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/warehouse/delivery-hall"],
    refetchInterval: 120000,
    staleTime: 90000,
  });

  const processedOrders = useMemo(() => {
    return deliveryOrders.map((order: any) => ({
      ...order,
      warehouse_received_kg: parseFloat(order.warehouse_received_kg) || 0,
      warehouse_delivered_kg: parseFloat(order.warehouse_delivered_kg) || 0,
      available_for_delivery:
        (parseFloat(order.warehouse_received_kg) || 0) -
        (parseFloat(order.warehouse_delivered_kg) || 0),
    }));
  }, [deliveryOrders]);

  const groupedByOrder = useMemo(() => {
    const groups: Record<
      string,
      {
        order_number: string;
        customer_name: string;
        customer_name_ar: string;
        items: any[];
      }
    > = {};
    processedOrders.forEach((po: any) => {
      const key = po.order_number || po.order_id;
      if (!groups[key]) {
        groups[key] = {
          order_number: po.order_number,
          customer_name: po.customer_name,
          customer_name_ar: po.customer_name_ar,
          items: [],
        };
      }
      groups[key].items.push(po);
    });
    return Object.values(groups);
  }, [processedOrders]);

  const deliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        "/api/warehouse/vouchers/finished-goods-out",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.message || t("warehouse.delivery.deliverySaveFailed"),
        );
      }
      return response.json();
    },
  });

  const handleSelectOrder = (productionOrderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(productionOrderId)) {
      newSelection.delete(productionOrderId);
    } else {
      newSelection.add(productionOrderId);
    }
    setSelectedOrders(newSelection);
  };

  const openDeliveryForOrder = (productionOrderId: string) => {
    setSelectedDeliveryOrderId(productionOrderId);
    setDeliveryWeights({});
    setDeliveryDialogOpen(true);
  };

  const deliveryTargetOrders = useMemo(() => {
    const targetIds = selectedDeliveryOrderId
      ? [selectedDeliveryOrderId]
      : Array.from(selectedOrders);
    return targetIds
      .map((id) =>
        processedOrders.find(
          (o: any) => o.production_order_id.toString() === id,
        ),
      )
      .filter(Boolean);
  }, [selectedDeliveryOrderId, selectedOrders, processedOrders]);

  const handleDeliverySubmit = async () => {
    if (!user?.id) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.delivery.loginRequired"),
        variant: "destructive",
      });
      return;
    }

    const targetOrders = selectedDeliveryOrderId
      ? [selectedDeliveryOrderId]
      : Array.from(selectedOrders);

    if (targetOrders.length === 0) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.delivery.selectAtLeastOne"),
        variant: "destructive",
      });
      return;
    }

    const ordersWithWeights = targetOrders
      .map((id) => {
        const weight = parseFloat(deliveryWeights[id] || "0");
        const order = processedOrders.find(
          (o: any) => o.production_order_id.toString() === id,
        );
        return { id, weight, order };
      })
      .filter((o) => o.weight > 0);

    if (ordersWithWeights.length === 0) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.delivery.enterWeight"),
        variant: "destructive",
      });
      return;
    }

    for (const { weight, order } of ordersWithWeights) {
      if (order && weight > order.available_for_delivery) {
        toast({
          title: t("warehouse.toast.error"),
          description: `${t("warehouse.delivery.weightExceedsAvailable")} (${order.production_order_number})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const nextNumRes = await fetch(
        "/api/warehouse/vouchers/next-number/FP-Del",
      );
      const { next_number } = await nextNumRes.json();

      const items = ordersWithWeights.map(
        ({ id: productionOrderId, weight, order }) => ({
          production_order_id: parseInt(productionOrderId),
          weight_kg: weight.toString(),
          product_description:
            order?.product_name_ar || order?.product_name || "",
          customer_id: order?.customer_id?.toString() || "",
          customer_name: order?.customer_name_ar || order?.customer_name || "",
          order_number: order?.order_number || "",
        }),
      );

      await deliveryMutation.mutateAsync({
        voucher_number: next_number,
        voucher_type: "customer_delivery",
        unit: "kg",
        notes: deliveryNotes || "",
        driver_name: driverName || null,
        driver_phone: driverPhone || null,
        vehicle_number: vehicleNumber || null,
        items,
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/delivery-hall"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/vouchers", "finished-goods-out"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/vouchers/stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setDeliveryDialogOpen(false);
      setSelectedOrders(new Set());
      setDeliveryWeights({});
      setDeliveryNotes("");
      setDriverName("");
      setDriverPhone("");
      setVehicleNumber("");
      setSelectedDeliveryOrderId(null);
      toast({
        title: t("warehouse.delivery.deliverySuccess"),
        description: t("warehouse.delivery.fpDelCreated"),
      });
    } catch (err: any) {
      toast({
        title: t("warehouse.toast.error"),
        description: err.message || t("warehouse.delivery.deliveryFailed"),
        variant: "destructive",
      });
    }
  };

  const allPoIds = processedOrders
    .filter((o: any) => o.available_for_delivery > 0)
    .map((o: any) => o.production_order_id.toString());

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                {t("warehouse.delivery.title")}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("warehouse.delivery.description")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={deliveryDialogOpen}
                onOpenChange={(open) => {
                  setDeliveryDialogOpen(open);
                  if (!open) {
                    setSelectedDeliveryOrderId(null);
                    setDeliveryWeights({});
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedOrders.size === 0}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Truck className="h-4 w-4 ml-2" />
                    {t("warehouse.delivery.deliverSelected")} (
                    {selectedOrders.size})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">
                      {t("warehouse.delivery.createFpDelTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {t("warehouse.delivery.createFpDelDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {deliveryTargetOrders.map((order: any) => {
                        const orderId = order.production_order_id.toString();
                        return (
                          <div
                            key={orderId}
                            className="border rounded-lg p-3 space-y-2 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">
                                {order.production_order_number}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {order.available_for_delivery.toFixed(2)}{" "}
                                {t("warehouse.delivery.kgAvailable")}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.product_name_ar || order.product_name}
                            </div>
                            <div>
                              <label className="text-xs font-medium">
                                {t("warehouse.delivery.deliveryWeight")} *
                              </label>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                max={order.available_for_delivery}
                                value={deliveryWeights[orderId] || ""}
                                onChange={(e) =>
                                  setDeliveryWeights((prev) => ({
                                    ...prev,
                                    [orderId]: e.target.value,
                                  }))
                                }
                                placeholder={t(
                                  "warehouse.delivery.enterDeliveryWeight",
                                )}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">
                          {t("warehouse.delivery.driverName")}
                        </label>
                        <Input
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder={t("warehouse.delivery.driverName")}
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">
                          {t("warehouse.delivery.driverPhone")}
                        </label>
                        <Input
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder={t("warehouse.delivery.phoneNumber")}
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">
                          {t("warehouse.delivery.vehicleNumber")}
                        </label>
                        <Input
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder={t("warehouse.delivery.vehicleNumber")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {t("warehouse.labels.notes")}
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder={t("warehouse.delivery.additionalNotes")}
                        className="w-full min-h-[60px] p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeliverySubmit}
                        disabled={deliveryMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {deliveryMutation.isPending
                          ? t("warehouse.delivery.saving")
                          : t("warehouse.delivery.confirmDelivery")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeliveryDialogOpen(false);
                          setSelectedDeliveryOrderId(null);
                        }}
                      >
                        {t("warehouse.buttons.cancel")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-gray-500">{t("warehouse.loading")}</p>
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("warehouse.delivery.noOrdersAvailable")}
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set(allPoIds))}
                  disabled={allPoIds.length === 0}
                >
                  {t("warehouse.delivery.selectAll")} ({allPoIds.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                  disabled={selectedOrders.size === 0}
                >
                  {t("warehouse.delivery.deselectAll")}
                </Button>
              </div>
              {groupedByOrder.map((group) => (
                <div
                  key={group.order_number}
                  className="border rounded-lg overflow-hidden mb-4"
                >
                  <div className="bg-orange-50 dark:bg-orange-900/20 px-3 sm:px-4 py-2 flex flex-wrap justify-between items-center gap-1">
                    <span className="font-bold sm:text-sm text-[20px] text-[#fa0a0a]">
                      {t("warehouse.production.order")}: {group.order_number}
                    </span>
                    <span className="font-bold sm:text-sm text-[20px] text-[#fa0a0a]">
                      {group.customer_name_ar || group.customer_name}
                    </span>
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[650px]">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="py-2 px-3 w-10"></th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.productionOrder")}
                          </th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.product")}
                          </th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.receivedKg")}
                          </th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.deliveredKg")}
                          </th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.availableKg")}
                          </th>
                          <th className="py-2 px-3 text-center font-medium whitespace-nowrap">
                            {t("warehouse.delivery.action")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((order: any) => {
                          const isSelected = selectedOrders.has(
                            order.production_order_id.toString(),
                          );
                          return (
                            <tr
                              key={order.production_order_id}
                              className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}
                            >
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleSelectOrder(
                                      order.production_order_id.toString(),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-medium whitespace-nowrap">
                                {order.production_order_number}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {order.product_name_ar || order.product_name}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {order.warehouse_received_kg.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {order.warehouse_delivered_kg.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <Badge
                                  variant={
                                    order.available_for_delivery > 0
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {order.available_for_delivery.toFixed(2)}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {order.available_for_delivery > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-300 hover:bg-orange-50 text-sm px-3"
                                    onClick={() =>
                                      openDeliveryForOrder(
                                        order.production_order_id.toString(),
                                      )
                                    }
                                  >
                                    <Truck className="h-3 w-3 ml-1" />
                                    {t("warehouse.delivery.deliver")}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden space-y-2 p-2">
                    {group.items.map((order: any) => {
                      const isSelected = selectedOrders.has(
                        order.production_order_id.toString(),
                      );
                      return (
                        <div
                          key={order.production_order_id}
                          className={`border rounded-lg p-3 space-y-2 ${isSelected ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleSelectOrder(
                                    order.production_order_id.toString(),
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span className="font-bold text-sm">
                                {order.production_order_number}
                              </span>
                            </div>
                            <Badge
                              variant={
                                order.available_for_delivery > 0
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {order.available_for_delivery.toFixed(2)}{" "}
                              {t("warehouse.delivery.kg")}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {order.product_name_ar || order.product_name}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.delivery.receivedLabel")}:
                              </span>
                              <span className="font-medium">
                                {order.warehouse_received_kg.toFixed(2)}{" "}
                                {t("warehouse.delivery.kg")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.delivery.deliveredLabel")}:
                              </span>
                              <span className="font-medium">
                                {order.warehouse_delivered_kg.toFixed(2)}{" "}
                                {t("warehouse.delivery.kg")}
                              </span>
                            </div>
                          </div>
                          {order.available_for_delivery > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                              onClick={() =>
                                openDeliveryForOrder(
                                  order.production_order_id.toString(),
                                )
                              }
                            >
                              <Truck className="h-3 w-3 ml-1" />
                              {t("warehouse.delivery.deliver")}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <VouchersList
        type="finished-goods-out"
        title={t("warehouse.delivery.archiveTitle")}
      />
    </div>
  );
}

function RawMaterialsSection({
  onCreateVoucherIn,
  onCreateVoucherOut,
}: {
  onCreateVoucherIn: () => void;
  onCreateVoucherOut: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="rm-rec" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:inline-flex sm:flex-nowrap sm:h-10">
          <TabsTrigger
            value="rm-rec"
            className="text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <ArrowDownToLine className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.production.rmRecVouchers")}
          </TabsTrigger>
          <TabsTrigger
            value="rm-del"
            className="text-xs px-2 py-1.5 sm:text-sm sm:px-3"
          >
            <ArrowUpFromLine className="h-4 w-4 ml-1 shrink-0" />
            {t("warehouse.production.rmDelVouchers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rm-rec">
          <div className="mb-3">
            <Button
              onClick={onCreateVoucherIn}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowDownToLine className="h-4 w-4 ml-2" />
              {t("warehouse.production.rmRecReceiptBtn")}
            </Button>
          </div>
          <VouchersList
            type="raw-material-in"
            title={t("warehouse.production.rmRecVouchersTitle")}
          />
        </TabsContent>
        <TabsContent value="rm-del">
          <div className="mb-3">
            <Button
              onClick={onCreateVoucherOut}
              className="bg-red-600 hover:bg-red-700"
            >
              <ArrowUpFromLine className="h-4 w-4 ml-2" />
              {t("warehouse.production.rmDelIssueBtn")}
            </Button>
          </div>
          <VouchersList
            type="raw-material-out"
            title={t("warehouse.production.rmDelVouchersTitle")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductionHallContent({
  onCreateVoucher,
}: {
  onCreateVoucher: () => void;
}) {
  const { t } = useTranslation();
  const ln = useLocalizedName();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptWeights, setReceiptWeights] = useState<Record<string, string>>(
    {},
  );
  const [receiptNotes, setReceiptNotes] = useState("");
  const [selectedReceiptOrderId, setSelectedReceiptOrderId] = useState<
    string | null
  >(null);
  // Per-line packaging selection: { [orderId]: { puId, count } }.
  // When a packaging unit is chosen and `count` is set, the weight input is
  // computed automatically (rolls_per_unit * roll_weight_g/1000 * count).
  const [receiptPackaging, setReceiptPackaging] = useState<
    Record<string, { puId: string; count: string }>
  >({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: productionOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/warehouse/production-hall"],
    refetchInterval: 120000,
    staleTime: 90000,
  });

  const processedOrders = useMemo(() => {
    return productionOrders.map((order: any) => ({
      ...order,
      quantity_required: parseFloat(order.quantity_required) || 0,
      total_film_weight: parseFloat(order.total_film_weight) || 0,
      total_print_weight: parseFloat(order.total_print_weight) || 0,
      total_cut_weight: parseFloat(order.total_cut_weight) || 0,
      total_received_weight: parseFloat(order.total_received_weight) || 0,
      waste_weight: parseFloat(order.waste_weight) || 0,
      remaining_to_receive:
        (parseFloat(order.total_cut_weight) || 0) -
        (parseFloat(order.total_received_weight) || 0),
    }));
  }, [productionOrders]);

  const groupedByOrder = useMemo(() => {
    const groups: Record<
      string,
      {
        order_number: string;
        customer_name: string;
        customer_name_ar: string;
        items: any[];
      }
    > = {};
    processedOrders.forEach((po: any) => {
      const key = po.order_number || po.order_id;
      if (!groups[key]) {
        groups[key] = {
          order_number: po.order_number,
          customer_name: po.customer_name,
          customer_name_ar: po.customer_name_ar,
          items: [],
        };
      }
      groups[key].items.push(po);
    });
    return Object.values(groups);
  }, [processedOrders]);

  const receiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        "/api/warehouse/vouchers/finished-goods-in",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error("Receipt save failed");
      return response.json();
    },
  });

  const handleSelectOrder = (productionOrderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(productionOrderId)) {
      newSelection.delete(productionOrderId);
    } else {
      newSelection.add(productionOrderId);
    }
    setSelectedOrders(newSelection);
  };

  const openReceiptForOrder = (productionOrderId: string) => {
    setSelectedReceiptOrderId(productionOrderId);
    setReceiptWeights({});
    setReceiptPackaging({});
    setReceiptDialogOpen(true);
  };

  const receiptTargetOrders = useMemo(() => {
    const targetIds = selectedReceiptOrderId
      ? [selectedReceiptOrderId]
      : Array.from(selectedOrders);
    return targetIds
      .map((id) =>
        processedOrders.find(
          (o: any) => o.production_order_id.toString() === id,
        ),
      )
      .filter(Boolean);
  }, [selectedReceiptOrderId, selectedOrders, processedOrders]);

  const handleReceiptSubmit = async () => {
    if (!user?.id) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.production.loginRequired"),
        variant: "destructive",
      });
      return;
    }

    const targetOrders = selectedReceiptOrderId
      ? [selectedReceiptOrderId]
      : Array.from(selectedOrders);

    if (targetOrders.length === 0) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.production.selectAtLeastOneOrder"),
        variant: "destructive",
      });
      return;
    }

    const ordersWithWeights = targetOrders
      .map((id) => {
        const weight = parseFloat(receiptWeights[id] || "0");
        const order = processedOrders.find(
          (o: any) => o.production_order_id.toString() === id,
        );
        return { id, weight, order };
      })
      .filter((o) => o.weight > 0);

    if (ordersWithWeights.length === 0) {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.production.enterReceiptWeight"),
        variant: "destructive",
      });
      return;
    }

    for (const { id, weight, order } of ordersWithWeights) {
      if (order && weight > order.remaining_to_receive) {
        toast({
          title: t("warehouse.toast.error"),
          description: `${t("warehouse.production.weightExceedsRemaining")} (${order.production_order_number})`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const nextNumRes = await fetch(
        "/api/warehouse/vouchers/next-number/FP-Rec",
      );
      const { next_number } = await nextNumRes.json();

      const items = ordersWithWeights.map(
        ({ id: productionOrderId, weight, order }) => {
          const pkg = receiptPackaging[productionOrderId];
          const hasPackaging = pkg?.puId && parseFloat(pkg?.count || "0") > 0;
          return {
            production_order_id: parseInt(productionOrderId),
            weight_kg: weight.toString(),
            product_description:
              order?.product_name_ar || order?.product_name || "",
            customer_id: order?.customer_id,
            customer_name:
              order?.customer_name_ar || order?.customer_name || "",
            order_number: order?.order_number || "",
            item_id: order?.item_id || undefined,
            packaging_unit_id: hasPackaging ? parseInt(pkg.puId) : undefined,
            units_count: hasPackaging ? pkg.count : undefined,
          };
        },
      );

      await receiptMutation.mutateAsync({
        voucher_number: next_number,
        voucher_type: "production_receipt",
        unit: "kg",
        notes: receiptNotes || "",
        items,
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/production-hall"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/vouchers", "finished-goods-in"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/warehouse/vouchers/stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setReceiptDialogOpen(false);
      setSelectedOrders(new Set());
      setReceiptWeights({});
      setReceiptPackaging({});
      setReceiptNotes("");
      setSelectedReceiptOrderId(null);
      toast({
        title: t("warehouse.production.receiptSuccess"),
        description: t("warehouse.production.fpRecCreated"),
      });
    } catch {
      toast({
        title: t("warehouse.toast.error"),
        description: t("warehouse.production.receiptFailed"),
        variant: "destructive",
      });
    }
  };

  const allPoIds = processedOrders
    .filter((o: any) => o.remaining_to_receive > 0)
    .map((o: any) => o.production_order_id.toString());

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-amber-600" />
                {t("warehouse.production.title")}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("warehouse.production.titleDesc")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={receiptDialogOpen}
                onOpenChange={(open) => {
                  setReceiptDialogOpen(open);
                  if (!open) {
                    setSelectedReceiptOrderId(null);
                    setReceiptWeights({});
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedOrders.size === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ArrowDownToLine className="h-4 w-4 ml-2" />
                    {t("warehouse.production.receiveSelected")} (
                    {selectedOrders.size})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">
                      {t("warehouse.production.createFpRecTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {t("warehouse.production.createFpRecDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {receiptTargetOrders.map((order: any) => {
                        const orderId = order.production_order_id.toString();
                        const pkg = receiptPackaging[orderId] || {
                          puId: "",
                          count: "",
                        };
                        return (
                          <div
                            key={orderId}
                            className="border rounded-lg p-3 space-y-2 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">
                                {order.production_order_number}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {order.remaining_to_receive.toFixed(2)}{" "}
                                {t("warehouse.units.kilo")}{" "}
                                {t("warehouse.production.remaining")}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.product_name_ar || order.product_name}
                            </div>
                            <PackagingUnitPicker
                              itemId={order.item_id || null}
                              selected={pkg}
                              onChange={(next, computedKg) => {
                                setReceiptPackaging((prev) => ({
                                  ...prev,
                                  [orderId]: next,
                                }));
                                if (computedKg != null) {
                                  setReceiptWeights((prev) => ({
                                    ...prev,
                                    [orderId]: computedKg.toFixed(3),
                                  }));
                                }
                              }}
                            />
                            <div>
                              <label className="text-xs font-medium">
                                {t("warehouse.production.receivedWeight")} (
                                {t("warehouse.units.kilo")}) *
                              </label>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                max={order.remaining_to_receive}
                                value={receiptWeights[orderId] || ""}
                                onChange={(e) =>
                                  setReceiptWeights((prev) => ({
                                    ...prev,
                                    [orderId]: e.target.value,
                                  }))
                                }
                                placeholder={t(
                                  "warehouse.production.enterReceivedWeight",
                                )}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {t("warehouse.labels.notes")}
                      </label>
                      <textarea
                        value={receiptNotes}
                        onChange={(e) => setReceiptNotes(e.target.value)}
                        placeholder={t(
                          "warehouse.placeholders.additionalNotes",
                        )}
                        className="w-full min-h-[60px] p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReceiptSubmit}
                        disabled={receiptMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {receiptMutation.isPending
                          ? t("warehouse.production.saving")
                          : t("warehouse.production.confirmReceiptBtn")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReceiptDialogOpen(false);
                          setSelectedReceiptOrderId(null);
                        }}
                      >
                        {t("warehouse.buttons.cancel")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Factory className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">
                {t("warehouse.production.noMaterialsReadyTitle")}
              </p>
              <p className="text-sm mt-1">
                {t("warehouse.production.noMaterialsReadyDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPoIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.size === allPoIds.length &&
                      allPoIds.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(new Set(allPoIds));
                      } else {
                        setSelectedOrders(new Set());
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("warehouse.production.selectAllOrders")} (
                    {allPoIds.length}{" "}
                    {t("warehouse.production.productionOrders")}{" "}
                    {t("warehouse.production.waitingReceipt")})
                  </span>
                </div>
              )}

              {groupedByOrder.map((group) => (
                <div
                  key={group.order_number}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Hash className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="font-bold sm:text-sm text-[20px] text-[#fa0a0a]">
                        {t("warehouse.production.order")}: {group.order_number}
                      </span>
                      <span className="text-gray-400 hidden sm:inline">|</span>
                      <User className="h-4 w-4 text-gray-500 shrink-0 hidden sm:inline" />
                      <span className="font-bold sm:text-sm text-[20px] text-[#fa0a0a]">
                        {group.customer_name_ar || group.customer_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.items.length}{" "}
                      {t("warehouse.production.productionOrders")}
                    </Badge>
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[1100px]">
                      <thead>
                        <tr className="border-b bg-gray-50 dark:bg-gray-900">
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap w-10"></th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.productionOrder")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.labels.item")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.requiredQuantity")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.producedFilm")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.printing")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.cutQuantity")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.received")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.remaining")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.waste")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap">
                            {t("warehouse.production.status")}
                          </th>
                          <th className="text-right py-2 px-3 font-medium whitespace-nowrap w-24">
                            {t("warehouse.production.receive")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((order: any) => {
                          const remaining = order.remaining_to_receive;
                          const isSelected = selectedOrders.has(
                            order.production_order_id.toString(),
                          );
                          return (
                            <tr
                              key={order.production_order_id}
                              className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                            >
                              <td className="py-2 px-3">
                                {remaining > 0 && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      handleSelectOrder(
                                        order.production_order_id.toString(),
                                      )
                                    }
                                    className="h-4 w-4"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3 font-medium whitespace-nowrap">
                                {order.production_order_number}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {order.product_name_ar || order.product_name}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {order.quantity_required.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {order.total_film_weight > 0 ? (
                                  <span className="text-blue-600">
                                    {order.total_film_weight.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {order.total_print_weight > 0 ? (
                                  <span className="text-purple-600">
                                    {order.total_print_weight.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="text-green-600 font-medium">
                                  {order.total_cut_weight.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="text-orange-600 font-medium">
                                  {order.total_received_weight.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`font-bold ${remaining > 0 ? "text-purple-600" : "text-green-600"}`}
                                >
                                  {remaining.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="text-red-600">
                                  {order.waste_weight.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {remaining > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="text-orange-600 border-orange-600 text-xs whitespace-nowrap"
                                  >
                                    {t("warehouse.production.waitingReceipt")}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600 text-xs whitespace-nowrap"
                                  >
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    {t("warehouse.production.complete")}
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {remaining > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-blue-300 text-blue-600 hover:bg-blue-50 px-3 whitespace-nowrap"
                                    onClick={() =>
                                      openReceiptForOrder(
                                        order.production_order_id.toString(),
                                      )
                                    }
                                  >
                                    <ArrowDownToLine className="h-3 w-3 ml-1" />
                                    {t("warehouse.production.receive")}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden space-y-2">
                    {group.items.map((order: any) => {
                      const remaining = order.remaining_to_receive;
                      const isSelected = selectedOrders.has(
                        order.production_order_id.toString(),
                      );
                      return (
                        <div
                          key={order.production_order_id}
                          className={`border rounded-lg p-3 space-y-2 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {remaining > 0 && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleSelectOrder(
                                      order.production_order_id.toString(),
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                              )}
                              <span className="font-bold text-sm">
                                {order.production_order_number}
                              </span>
                            </div>
                            {remaining > 0 ? (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-600 text-xs"
                              >
                                {t("warehouse.production.waitingReceipt")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-600 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 ml-1" />
                                {t("warehouse.production.complete")}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {order.product_name_ar || order.product_name}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.production.requiredQuantity")}:
                              </span>
                              <span className="font-medium">
                                {order.quantity_required.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.production.cutQuantity")}:
                              </span>
                              <span className="text-green-600 font-medium">
                                {order.total_cut_weight.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.production.received")}:
                              </span>
                              <span className="text-orange-600 font-medium">
                                {order.total_received_weight.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {t("warehouse.production.remaining")}:
                              </span>
                              <span
                                className={`font-bold ${remaining > 0 ? "text-purple-600" : "text-green-600"}`}
                              >
                                {remaining.toFixed(2)}
                              </span>
                            </div>
                            {order.total_film_weight > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  {t("warehouse.production.producedFilm")}:
                                </span>
                                <span className="text-blue-600">
                                  {order.total_film_weight.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {order.waste_weight > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  {t("warehouse.production.waste")}:
                                </span>
                                <span className="text-red-600">
                                  {order.waste_weight.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                          {remaining > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                openReceiptForOrder(
                                  order.production_order_id.toString(),
                                )
                              }
                            >
                              <ArrowDownToLine className="h-3 w-3 ml-1" />
                              {t("warehouse.production.receive")}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// PackagingUnitPicker: per-line dropdown + units count input.
// Fetches packaging units for the given item and computes weight = unit_weight_kg * count.
// Falls back gracefully when item has no packaging units configured.
function PackagingUnitPicker({
  itemId,
  selected,
  onChange,
}: {
  itemId: string | null;
  selected: { puId: string; count: string };
  onChange: (
    next: { puId: string; count: string },
    computedKg: number | null,
  ) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageItems = userHasPermission(user, "manage_items");
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const { data: units = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/items", itemId, "packaging-units"],
    enabled: !!itemId,
  });

  const activeUnits = (units || []).filter((u: any) => u.is_active);
  const selectedUnit = activeUnits.find(
    (u: any) => String(u.id) === selected.puId,
  );

  // Auto-select the default packaging unit on first load AND keep the picker
  // in sync after edits/toggles from the manage dialog:
  //   - If nothing is selected yet, pick the default (or first) active unit.
  //   - If the previously-selected unit was deactivated/removed, fall back to
  //     the new default; clear the selection if no active units remain.
  //   - If the selected unit is still active, recompute kg using the latest
  //     unit_weight_kg so weight edits are reflected immediately.
  useEffect(() => {
    if (!selected.puId) {
      if (activeUnits.length === 0) return;
      const def = activeUnits.find((u: any) => u.is_default) || activeUnits[0];
      if (!def) return;
      const count = "1";
      const kg = parseFloat(def.unit_weight_kg) * parseFloat(count);
      onChange({ puId: String(def.id), count }, kg);
      return;
    }
    const sel = activeUnits.find((u: any) => String(u.id) === selected.puId);
    if (!sel) {
      if (activeUnits.length === 0) {
        onChange({ puId: "", count: "" }, null);
        return;
      }
      const def = activeUnits.find((u: any) => u.is_default) || activeUnits[0];
      const count = selected.count || "1";
      const kg = parseFloat(def.unit_weight_kg) * parseFloat(count);
      onChange({ puId: String(def.id), count }, kg);
      return;
    }
    const count = selected.count || "1";
    const kg = parseFloat(sel.unit_weight_kg) * parseFloat(count);
    onChange({ puId: selected.puId, count }, kg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  const handleUnit = (val: string) => {
    if (val === "manual") {
      onChange({ puId: "", count: "" }, null);
      return;
    }
    const u = activeUnits.find((x: any) => String(x.id) === val);
    const count = selected.count || "1";
    const kg = u ? parseFloat(u.unit_weight_kg) * parseFloat(count) : null;
    onChange({ puId: val, count }, kg);
  };

  const handleCount = (val: string) => {
    const u = selectedUnit;
    const kg =
      u && parseFloat(val) > 0
        ? parseFloat(u.unit_weight_kg) * parseFloat(val)
        : null;
    onChange({ puId: selected.puId, count: val }, kg);
  };

  const handleCreated = (created: any) => {
    if (!created || !created.id) return;
    const count = selected.count || "1";
    const kg =
      parseFloat(created.unit_weight_kg) * parseFloat(count) || null;
    onChange({ puId: String(created.id), count }, kg);
  };

  if (!itemId) return null;
  if (isLoading) return null;
  if (activeUnits.length === 0) {
    const hasInactive = (units || []).length > 0;
    return (
      <div className="space-y-1">
        <div className="text-[11px] text-gray-400 italic">
          {t("warehouse.production.noPackagingUnits")}
        </div>
        {canManageItems && (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="w-3 h-3 ml-1" />
                {t("warehouse.production.addPackagingUnit")}
              </Button>
              {hasInactive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-700"
                  onClick={() => setManageOpen(true)}
                  title={t("warehouse.production.managePackagingUnits")}
                >
                  <Sliders className="w-3 h-3 ml-1" />
                  {t("warehouse.production.managePackagingUnitsShort")}
                </Button>
              )}
            </div>
            <AddPackagingUnitDialog
              itemId={itemId}
              open={addOpen}
              onClose={() => setAddOpen(false)}
              onCreated={handleCreated}
            />
            <ManagePackagingUnitsDialog
              itemId={itemId}
              open={manageOpen}
              onClose={() => setManageOpen(false)}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium">
            {t("warehouse.production.packagingUnit")}
          </label>
          {canManageItems && (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] text-blue-600 hover:text-blue-700"
                onClick={() => setAddOpen(true)}
                title={t("warehouse.production.addPackagingUnit")}
              >
                <Plus className="w-3 h-3 ml-0.5" />
                {t("warehouse.production.addPackagingUnitShort")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] text-blue-600 hover:text-blue-700"
                onClick={() => setManageOpen(true)}
                title={t("warehouse.production.managePackagingUnits")}
              >
                <Sliders className="w-3 h-3 ml-0.5" />
                {t("warehouse.production.managePackagingUnitsShort")}
              </Button>
            </div>
          )}
        </div>
        <Select value={selected.puId || "manual"} onValueChange={handleUnit}>
          <SelectTrigger className="mt-1 h-9 text-xs">
            <SelectValue
              placeholder={t("warehouse.production.selectPackagingUnit")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              {t("warehouse.production.manualEntry")}
            </SelectItem>
            {activeUnits.map((u: any) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name} — {parseFloat(u.unit_weight_kg).toFixed(3)}{" "}
                {t("warehouse.units.kilo")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium">
          {t("warehouse.production.unitsCount")}
        </label>
        <Input
          type="number"
          min="0"
          step="1"
          value={selected.count}
          onChange={(e) => handleCount(e.target.value)}
          disabled={!selected.puId}
          className="mt-1 h-9 text-xs"
        />
      </div>
      {canManageItems && (
        <>
          <AddPackagingUnitDialog
            itemId={itemId}
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onCreated={handleCreated}
          />
          <ManagePackagingUnitsDialog
            itemId={itemId}
            open={manageOpen}
            onClose={() => setManageOpen(false)}
          />
        </>
      )}
    </div>
  );
}

// AddPackagingUnitDialog: compact dialog to create a packaging unit from the
// receipt screen. Mirrors the create form on the Definitions page but trimmed
// down to the essentials. On success, calls onCreated with the new unit so the
// caller can auto-select it.
function AddPackagingUnitDialog({
  itemId,
  open,
  onClose,
  onCreated,
}: {
  itemId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (unit: any) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    roll_weight_g: "",
    rolls_per_unit: "",
    is_default: false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        roll_weight_g: "",
        rolls_per_unit: "",
        is_default: false,
      });
    }
  }, [open]);

  const computed =
    parseFloat(form.roll_weight_g || "0") > 0 &&
    parseInt(form.rolls_per_unit || "0") > 0
      ? (parseFloat(form.roll_weight_g) * parseInt(form.rolls_per_unit)) /
        1000
      : null;

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        `/api/items/${itemId}/packaging-units`,
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            roll_weight_g: parseFloat(form.roll_weight_g),
            rolls_per_unit: parseInt(form.rolls_per_unit),
            is_default: form.is_default,
            is_active: true,
          }),
        },
      );
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/items", itemId, "packaging-units"],
      });
      toast({ title: t("common.success") });
      onCreated(data);
      onClose();
    },
    onError: (e: any) =>
      toast({
        title: t("definitions.items.packagingUnits.saveError"),
        description: e?.message,
        variant: "destructive",
      }),
  });

  const isValid =
    form.name.trim().length > 0 &&
    parseFloat(form.roll_weight_g) > 0 &&
    parseInt(form.rolls_per_unit) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    createMut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("warehouse.production.addPackagingUnitTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("definitions.items.packagingUnits.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">
              {t("definitions.items.packagingUnits.name")}
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t(
                "definitions.items.packagingUnits.namePlaceholder",
              )}
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {t("definitions.items.packagingUnits.rollWeightG")}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.roll_weight_g}
                onChange={(e) =>
                  setForm({ ...form, roll_weight_g: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">
                {t("definitions.items.packagingUnits.rollsPerUnit")}
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.rolls_per_unit}
                onChange={(e) =>
                  setForm({ ...form, rolls_per_unit: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="add-pu-default"
              checked={form.is_default}
              onCheckedChange={(c) =>
                setForm({ ...form, is_default: !!c })
              }
            />
            <Label htmlFor="add-pu-default" className="text-xs">
              {t("definitions.items.packagingUnits.isDefault")}
            </Label>
          </div>
          {computed !== null && (
            <div className="text-xs text-gray-500">
              {t("definitions.items.packagingUnits.computed", {
                kg: computed.toFixed(3),
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMut.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid || createMut.isPending}
            >
              <Plus className="w-4 h-4 ml-1" />
              {t("definitions.items.packagingUnits.addNew")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ManagePackagingUnitsDialog: inline edit / set-default / activate-toggle for
// existing packaging units, opened from the receipt screen. Mutations target
// PATCH /api/packaging-units/:id and invalidate the per-item units query so
// the picker refreshes without closing the receipt dialog.
function ManagePackagingUnitsDialog({
  itemId,
  open,
  onClose,
}: {
  itemId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["/api/items", itemId, "packaging-units"];
  const { data: units = [], isLoading } = useQuery<any[]>({
    queryKey,
    enabled: open,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    roll_weight_g: "",
    rolls_per_unit: "",
  });

  useEffect(() => {
    if (!open) setEditingId(null);
  }, [open]);

  const editComputed =
    parseFloat(editForm.roll_weight_g || "0") > 0 &&
    parseInt(editForm.rolls_per_unit || "0") > 0
      ? (parseFloat(editForm.roll_weight_g) *
          parseInt(editForm.rolls_per_unit)) /
        1000
      : null;

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditForm({
      name: u.name || "",
      roll_weight_g: String(u.roll_weight_g ?? ""),
      rolls_per_unit: String(u.rolls_per_unit ?? ""),
    });
  };

  const updateMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/packaging-units/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name.trim(),
          roll_weight_g: parseFloat(editForm.roll_weight_g),
          rolls_per_unit: parseInt(editForm.rolls_per_unit),
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingId(null);
      toast({ title: t("common.success") });
    },
    onError: (e: any) =>
      toast({
        title: t("definitions.items.packagingUnits.saveError"),
        description: e?.message,
        variant: "destructive",
      }),
  });

  const toggleMut = useMutation({
    mutationFn: async (u: any) => {
      const res = await apiRequest(`/api/packaging-units/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e: any) =>
      toast({
        title: t("definitions.items.packagingUnits.saveError"),
        description: e?.message,
        variant: "destructive",
      }),
  });

  const setDefaultMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/packaging-units/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_default: true }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e: any) =>
      toast({
        title: t("definitions.items.packagingUnits.saveError"),
        description: e?.message,
        variant: "destructive",
      }),
  });

  const submitEdit = (id: number) => {
    if (
      !editForm.name.trim() ||
      !(parseFloat(editForm.roll_weight_g) > 0) ||
      !(parseInt(editForm.rolls_per_unit) > 0)
    ) {
      return;
    }
    updateMut.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("warehouse.production.managePackagingUnitsTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("definitions.items.packagingUnits.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-right p-2">
                  {t("definitions.items.packagingUnits.name")}
                </th>
                <th className="text-center p-2">
                  {t("definitions.items.packagingUnits.rollWeightG")}
                </th>
                <th className="text-center p-2">
                  {t("definitions.items.packagingUnits.rollsPerUnit")}
                </th>
                <th className="text-center p-2">
                  {t("definitions.items.packagingUnits.unitWeightKg")}
                </th>
                <th className="text-center p-2">
                  {t("definitions.items.packagingUnits.isDefault")}
                </th>
                <th className="text-center p-2">
                  {t("definitions.items.packagingUnits.isActive")}
                </th>
                <th className="text-center p-2"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    <Loader2 className="inline w-4 h-4 animate-spin" />
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    {t("definitions.items.packagingUnits.noUnits")}
                  </td>
                </tr>
              ) : (
                units.map((u: any) => {
                  const isEditing = editingId === u.id;
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">
                        {isEditing ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                name: e.target.value,
                              })
                            }
                            className="h-8"
                          />
                        ) : (
                          u.name
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.roll_weight_g}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roll_weight_g: e.target.value,
                              })
                            }
                            className="h-8 text-center"
                          />
                        ) : (
                          parseFloat(u.roll_weight_g).toFixed(2)
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={editForm.rolls_per_unit}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                rolls_per_unit: e.target.value,
                              })
                            }
                            className="h-8 text-center"
                          />
                        ) : (
                          u.rolls_per_unit
                        )}
                      </td>
                      <td className="p-2 text-center font-medium">
                        {isEditing && editComputed !== null
                          ? editComputed.toFixed(3)
                          : parseFloat(u.unit_weight_kg).toFixed(3)}
                      </td>
                      <td className="p-2 text-center">
                        {u.is_default ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✓
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              isEditing ||
                              !u.is_active ||
                              setDefaultMut.isPending
                            }
                            onClick={() => setDefaultMut.mutate(u.id)}
                          >
                            —
                          </Button>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={!!u.is_active}
                          disabled={isEditing || toggleMut.isPending}
                          onCheckedChange={() => toggleMut.mutate(u)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={updateMut.isPending}
                              onClick={() => submitEdit(u.id)}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              {t("common.cancel")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(u)}
                            title={t("common.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
