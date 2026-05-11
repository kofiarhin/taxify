import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../services/bookingService';
import { queryKeys } from '../queryKeys';

export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
  });
};

export const useBookingActionMutation = (action) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
  });
};
