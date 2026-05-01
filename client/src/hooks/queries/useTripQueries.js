import { useQuery } from "@tanstack/react-query";
import { getAllTrips, getMyAssignment, getMyTrips } from "../../services/tripService";
import { queryKeys } from "../queryKeys";

export function useMyAssignmentQuery() {
  return useQuery({
    queryKey: queryKeys.myAssignment,
    queryFn: getMyAssignment,
    refetchInterval: 8000,
  });
}

export function useDriverTripsQuery() {
  return useQuery({
    queryKey: queryKeys.driverTrips,
    queryFn: () => getMyTrips(),
  });
}

export function useAllTripsQuery() {
  return useQuery({
    queryKey: queryKeys.tripsAll,
    queryFn: () => getAllTrips(),
    refetchInterval: 20000,
  });
}
