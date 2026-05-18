import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '../../services/tripService';
import { queryKeys } from '../queryKeys';

const invalidatesBookings = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
  });
};

export const useAcceptTripMutation = () => invalidatesBookings(tripService.accept);
export const useRejectTripMutation = () => invalidatesBookings(tripService.reject);
export const useStartTripMutation = () => invalidatesBookings(tripService.start);
export const useEndTripMutation = () => invalidatesBookings(({ bookingId, payload }) => tripService.end(bookingId, payload));
export const useClientConfirmCompletionMutation = () => invalidatesBookings(tripService.clientConfirmCompletion);
export const useDriverReceivedMutation = () => invalidatesBookings(tripService.driverReceived);
