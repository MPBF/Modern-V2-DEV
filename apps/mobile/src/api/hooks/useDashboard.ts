import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Endpoints, type DashboardStats } from "@mpbf/shared";

interface MobileDashboardResponse {
  stats?: DashboardStats;
  notifications?: unknown[];
  [key: string]: any;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["mobile", "dashboard"],
    queryFn: async () => {
      const res = await api.get<MobileDashboardResponse>(Endpoints.mobileDashboard);
      // The endpoint may also return raw stats; normalize:
      const body = res.data ?? {};
      const stats = (body as any).stats ?? body;
      return { stats, raw: body } as { stats: DashboardStats; raw: MobileDashboardResponse };
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get<DashboardStats | { data: DashboardStats }>(Endpoints.dashboardStats);
      const data: any = res.data;
      return (data?.data ?? data) as DashboardStats;
    },
  });
}
