import { useQuery } from "@tanstack/react-query";
import { getBookings, getQueue } from "../../services/bookingService";
import { queryKeys } from "../queryKeys";

export function useBookingsQuery(statusFilter = "") {
  return useQuery({
    queryKey: queryKeys.bookings(statusFilter),
    queryFn: () => getBookings(statusFilter ? { status: statusFilter } : {}),
    refetchInterval: 15000,
  });
}

export function useAgentBookingsQuery() {
  return useQuery({
    queryKey: queryKeys.agentBookings,
    queryFn: () => getBookings({ limit: 20 }),
    refetchInterval: 15000,
  });
}

export function useQueueQuery() {
  return useQuery({
    queryKey: queryKeys.queue,
    queryFn: getQueue,
    refetchInterval: 10000,
  });
}
