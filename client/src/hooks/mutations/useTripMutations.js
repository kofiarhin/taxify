import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptAssignment,
  confirmPayment,
  endTrip,
  rejectAssignment,
  startTrip,
} from "../../services/tripService";
import { queryKeys } from "../queryKeys";

async function invalidateTripQueries(queryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.myAssignment });
  await queryClient.invalidateQueries({ queryKey: queryKeys.driverTrips });
  await queryClient.invalidateQueries({ queryKey: queryKeys.agentBookings });
  await queryClient.invalidateQueries({ queryKey: queryKeys.queue });
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

export function useAcceptAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => acceptAssignment(id),
    onSuccess: async () => invalidateTripQueries(queryClient),
  });
}

export function useRejectAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => rejectAssignment(id, reason),
    onSuccess: async () => invalidateTripQueries(queryClient),
  });
}

export function useStartTripMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => startTrip(id),
    onSuccess: async () => invalidateTripQueries(queryClient),
  });
}

export function useEndTripMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => endTrip(id),
    onSuccess: async () => invalidateTripQueries(queryClient),
  });
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => confirmPayment(id),
    onSuccess: async () => {
      await invalidateTripQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: queryKeys.driverCommissions });
    },
  });
}
