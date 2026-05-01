import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, createBooking, retryAssignment } from "../../services/bookingService";
import { queryKeys } from "../queryKeys";

export function useCreateBookingMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.agentBookings });
      await queryClient.invalidateQueries({ queryKey: queryKeys.queue });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cancelBooking(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.agentBookings });
      await queryClient.invalidateQueries({ queryKey: queryKeys.queue });
    },
  });
}

export function useRetryAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryAssignment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.queue });
      await queryClient.invalidateQueries({ queryKey: queryKeys.agentBookings });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookingsRoot });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAssignment });
    },
  });
}
