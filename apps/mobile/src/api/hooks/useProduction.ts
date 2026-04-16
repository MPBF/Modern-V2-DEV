import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type ProductionOrder, type Roll } from "@mpbf/shared";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

export function useProductionOrders() {
  return useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => {
      const res = await api.get(Endpoints.productionOrders);
      return unwrapList<ProductionOrder>(res.data);
    },
  });
}

export function useRolls(params?: { stage?: string; production_order_id?: number }) {
  return useQuery({
    queryKey: ["rolls", params],
    queryFn: async () => {
      const res = await api.get(Endpoints.rolls, { params });
      return unwrapList<Roll>(res.data);
    },
  });
}

export function useUpdateRoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; data: Partial<Roll> }) => {
      const res = await api.patch(Endpoints.rollById(payload.id), payload.data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rolls"] });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });
}

export function useMarkPrinted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(Endpoints.rollMarkPrinted(id));
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rolls"] });
    },
  });
}
