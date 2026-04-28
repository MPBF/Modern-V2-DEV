import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  safeParseFloat,
  formatNumberAr,
} from "../../../../shared/number-utils";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { toastMessages } from "../../lib/toastMessages";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";

import type { Machine } from "../../../../shared/schema";

interface RollCreationModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrderId: number;
  productionOrderData?: any;
  isFinalRoll?: boolean;
}

const rollFormSchema = z.object({
  weight_kg: z
    .string()
    .min(1, "يرجى إدخال الوزن")
    .refine((val) => {
      const num = safeParseFloat(val.replace(",", "."), -1);
      return num > 0;
    }, "الوزن يجب أن يكون رقمًا أكبر من 0"),
  film_machine_id: z.string().min(1, "يرجى اختيار ماكينة الفيلم"),
  is_final_roll: z.boolean().default(false),
});

export type RollFormData = z.infer<typeof rollFormSchema>;

export default function RollCreationModalEnhanced({
  isOpen,
  onClose,
  productionOrderId,
  productionOrderData,
  isFinalRoll = false,
}: RollCreationModalEnhancedProps) {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const { toast } = useToast();
  const [lastProductionTime, setLastProductionTime] = useState<number | null>(
    null,
  );

  const form = useForm<RollFormData>({
    resolver: zodResolver(rollFormSchema),
    defaultValues: {
      weight_kg: "",
      film_machine_id: "",
      is_final_roll: isFinalRoll,
    },
    mode: "onChange",
  });

  // Set final roll checkbox when prop changes
  useEffect(() => {
    form.setValue("is_final_roll", isFinalRoll);
  }, [isFinalRoll, form]);

  // Fetch machines
  const { data: machines = [], isLoading: machinesLoading } = useQuery<
    Machine[]
  >({
    queryKey: ["/api/machines"],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Filter film machines only (section_id = "SEC03" for film section)
  const filmMachines = useMemo(() => {
    return machines.filter(
      (m) => m.section_id === "SEC03" && m.status === "active",
    );
  }, [machines]);

  // Calculate remaining quantity
  const remainingQuantity = useMemo(() => {
    if (!productionOrderData) return 0;
    const required = Number(
      productionOrderData.final_quantity_kg ||
        productionOrderData.quantity_kg ||
        0,
    );
    const produced = Number(productionOrderData.total_weight_produced || 0);
    return Math.max(0, required - produced);
  }, [productionOrderData]);

  // Suggest roll number
  const suggestedRollNumber = useMemo(() => {
    if (!productionOrderData) return "";
    const rollsCount = productionOrderData.rolls_count || 0;
    return `${productionOrderData.production_order_number}-R${String(rollsCount + 1).padStart(3, "0")}`;
  }, [productionOrderData]);

  // Set default weight to remaining quantity
  useEffect(() => {
    if (!form.getValues("weight_kg") && remainingQuantity > 0) {
      form.setValue("weight_kg", String(remainingQuantity));
    }
  }, [remainingQuantity, form]);

  // Create roll mutation
  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));

      // Choose endpoint based on whether it's a final roll
      const endpoint = data.is_final_roll
        ? "/api/rolls/create-final"
        : "/api/rolls/create-with-timing";

      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          production_order_id: productionOrderId,
          weight_kg: weightParsed,
          film_machine_id: data.film_machine_id,
          is_last_roll: data.is_final_roll,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.message || t("modals.rollCreationEnhanced.createFailed"),
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      const rollNumber = data.roll_number || "";
      const message = data.is_last_roll
        ? toastMessages.rolls.finalRollCreated(rollNumber)
        : toastMessages.rolls.created(rollNumber);

      toast({
        title: message.title,
        description: message.description,
      });

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["/api/production-orders/active-for-operator"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-queues"] });

      onClose();
      form.reset();
    },
    onError: (error: unknown) => {
      console.error("Roll creation error:", error);
      toast({
        title: t("modals.rollCreationEnhanced.createErrorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("modals.rollCreationEnhanced.unexpectedError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RollFormData) => {
    // Warn if creating final roll with significant remaining quantity
    if (data.is_final_roll && remainingQuantity > 50) {
      if (
        !confirm(
          `${t("modals.rollCreationEnhanced.remainingWarning", { quantity: formatNumberAr(remainingQuantity, 2) })} ${t("modals.rollCreationEnhanced.confirmFinalRoll")}`,
        )
      ) {
        return;
      }
    }
    createRollMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full sm:w-[calc(100vw-1rem)] max-w-full sm:max-w-[500px] max-h-[55vh] sm:max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-b-2xl rounded-t-none sm:rounded-2xl top-0 sm:top-1/2 left-1/2 -translate-x-1/2 translate-y-0 sm:-translate-y-1/2 data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-top-1/2 sm:data-[state=open]:slide-in-from-top-[48%] sm:data-[state=closed]:slide-out-to-top-[48%]"
        dir={dir}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">
            {isFinalRoll
              ? t("modals.rollCreationEnhanced.titleFinal")
              : t("modals.rollCreationEnhanced.title")}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {productionOrderData
              ? `${t("modals.rollCreationEnhanced.productionOrder")}: ${productionOrderData.production_order_number}`
              : t("modals.rollCreationEnhanced.title")}
          </DialogDescription>
        </DialogHeader>

        {productionOrderData && (
          <div className="mt-1 space-y-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p>
              <span className="text-gray-500">
                {t("modals.rollCreationEnhanced.product")}:
              </span>{" "}
              <span className="font-bold">
                {productionOrderData.product_name}
              </span>
            </p>
            <p>
              <span className="text-gray-500">
                {t("modals.rollCreationEnhanced.customer")}:
              </span>{" "}
              <span className="font-bold">
                {productionOrderData.customer_name}
              </span>
            </p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Suggested Roll Number */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
                {t("modals.rollCreationEnhanced.suggestedRollNumber")}:{" "}
                <strong className="font-extrabold">{suggestedRollNumber}</strong>
              </p>
            </div>

            {/* Production Stats */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("modals.rollCreationEnhanced.remainingQuantity")}
                </p>
              </div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
                {formatNumberAr(remainingQuantity, 2)}{" "}
                {t("modals.rollCreationEnhanced.kg")}
              </p>
              {remainingQuantity < 50 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t("modals.rollCreationEnhanced.nearCompletion")}
                </p>
              )}
            </div>

            {/* Weight Input */}
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">
                    {t("modals.rollCreationEnhanced.weightKg")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder={t("modals.rollCreationEnhanced.enterWeight")}
                      className="text-right h-12 text-lg font-bold"
                      data-testid="input-weight"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Machine Selection */}
            <FormField
              control={form.control}
              name="film_machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">
                    {t("modals.rollCreationEnhanced.filmMachine")}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={machinesLoading}
                  >
                    <FormControl>
                      <SelectTrigger
                        data-testid="select-machine"
                        className="h-12 text-base font-semibold"
                      >
                        <SelectValue
                          placeholder={t(
                            "modals.rollCreationEnhanced.selectMachine",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filmMachines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name_ar || machine.name} - {machine.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Final Roll Checkbox */}
            {!isFinalRoll && productionOrderData?.rolls_count > 0 && (
              <FormField
                control={form.control}
                name="is_final_roll"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-final-roll"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none mr-2">
                      <FormLabel className="cursor-pointer">
                        {t("modals.rollCreationEnhanced.finalRollLabel")}
                      </FormLabel>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("modals.rollCreationEnhanced.finalRollDescription")}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Warning for final roll */}
            {(form.watch("is_final_roll") || isFinalRoll) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-semibold">
                      {t("modals.rollCreationEnhanced.warningFinalRoll")}
                    </p>
                    <p>{t("modals.rollCreationEnhanced.afterCreatingRoll")}</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        {t("modals.rollCreationEnhanced.filmStageWillClose")}
                      </li>
                      <li>{t("modals.rollCreationEnhanced.noMoreRolls")}</li>
                      <li>
                        {t("modals.rollCreationEnhanced.totalTimeCalculated")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createRollMutation.isPending}
                className="flex-1 h-12 text-base font-bold"
              >
                {t("modals.rollCreationEnhanced.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createRollMutation.isPending}
                data-testid="button-submit-roll"
                variant={
                  form.watch("is_final_roll") || isFinalRoll
                    ? "destructive"
                    : "default"
                }
                className="flex-1 h-12 text-base font-bold"
              >
                {createRollMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    {t("modals.rollCreationEnhanced.creating")}
                  </>
                ) : form.watch("is_final_roll") || isFinalRoll ? (
                  t("modals.rollCreationEnhanced.createFinalRoll")
                ) : (
                  t("modals.rollCreationEnhanced.createRoll")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
