import { useQuery } from "@tanstack/react-query";
import { getCurrentClientBooking } from "../../services/clientBookingService";
import { queryKeys } from "../queryKeys";

export function useClientCurrentBookingQuery() {
  return useQuery({
    queryKey: queryKeys.clientCurrentBooking,
    queryFn: getCurrentClientBooking,
    refetchInterval: 8000,
  });
}
