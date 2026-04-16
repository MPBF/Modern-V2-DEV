import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type InventoryItem } from "@mpbf/shared";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  return [];
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await api.get(Endpoints.inventory);
      return unwrapList<InventoryItem>(res.data);
    },
  });
}
