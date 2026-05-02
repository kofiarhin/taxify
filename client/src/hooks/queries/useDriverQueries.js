import { useQuery } from "@tanstack/react-query";
import { getDrivers, getPendingDrivers } from "../../services/driverService";
import { queryKeys } from "../queryKeys";

export function usePendingDriversQuery() {
  return useQuery({
    queryKey: queryKeys.driversPending,
    queryFn: getPendingDrivers,
  });
}

export function useAllDriversQuery() {
  return useQuery({
    queryKey: queryKeys.driversAll,
    queryFn: getDrivers,
  });
}
