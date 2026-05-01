import { useQuery } from "@tanstack/react-query";
import { getAllCommissions, getMyCommissions } from "../../services/commissionService";
import { queryKeys } from "../queryKeys";

export function useAllCommissionsQuery() {
  return useQuery({
    queryKey: queryKeys.commissionsAll,
    queryFn: () => getAllCommissions(),
  });
}

export function useDriverCommissionsQuery() {
  return useQuery({
    queryKey: queryKeys.driverCommissions,
    queryFn: () => getMyCommissions(),
  });
}
