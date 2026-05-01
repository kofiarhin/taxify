import { useQuery } from "@tanstack/react-query";
import { getPendingDrivers } from "../../services/driverService";
import { getUsers } from "../../services/userService";
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
    queryFn: async () => {
      const users = await getUsers({ limit: 100 });
      return users.filter((user) => user.role === "DRIVER");
    },
  });
}
