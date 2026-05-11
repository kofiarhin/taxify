import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driverReviewService } from '../../services/driverReviewService';
import { queryKeys } from '../queryKeys';

export const useDriverReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }) => driverReviewService.create(bookingId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
  });
};
