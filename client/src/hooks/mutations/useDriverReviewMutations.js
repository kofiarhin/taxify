import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitDriverReview } from "../../services/driverReviewService";
import { queryKeys } from "../queryKeys";

export function useSubmitDriverReviewMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitDriverReview,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientCurrentBooking });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAssignment });
      await queryClient.invalidateQueries({ queryKey: queryKeys.myDriverProfile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.driversAll });
      if (options.onSuccess) await options.onSuccess(...args);
    },
  });
}
