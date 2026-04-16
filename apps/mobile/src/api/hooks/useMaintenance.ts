import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type MaintenanceRequest } from "@mpbf/shared";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      const res = await api.get(Endpoints.maintenanceRequests);
      return unwrapList<MaintenanceRequest>(res.data);
    },
  });
}
