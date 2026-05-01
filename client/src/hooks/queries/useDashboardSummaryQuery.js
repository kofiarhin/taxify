import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../../services/dashboardService";
import { queryKeys } from "../queryKeys";

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: getDashboardSummary,
    refetchInterval: 15000,
  });
}
