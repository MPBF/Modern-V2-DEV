import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type Order } from "@mpbf/shared";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.orders)) return payload.orders as T[];
  return [];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get(Endpoints.orders);
      return unwrapList<Order>(res.data);
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await api.get(Endpoints.myOrders);
      return unwrapList<Order>(res.data);
    },
  });
}

export function useOrder(id: string | number | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    enabled: id !== undefined,
    queryFn: async () => {
      const res = await api.get(Endpoints.orderById(id!));
      const body: any = res.data;
      return (body?.data ?? body) as Order;
    },
  });
}
