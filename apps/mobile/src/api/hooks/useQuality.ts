import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type QualityIssue } from "@mpbf/shared";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

export function useQualityIssues() {
  return useQuery({
    queryKey: ["quality-issues"],
    queryFn: async () => {
      const res = await api.get(Endpoints.qualityIssues);
      return unwrapList<QualityIssue>(res.data);
    },
  });
}
