import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmClientBookingComplete,
  createClientBooking,
} from "../../services/clientBookingService";
import { queryKeys } from "../queryKeys";

export function useCreateClientBookingMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientBooking,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientCurrentBooking });
      if (options.onSuccess) await options.onSuccess(...args);
    },
  });
}

export function useConfirmClientCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmClientBookingComplete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientCurrentBooking });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAssignment });
    },
  });
}
