import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driverService } from '../../services/driverService';
import { queryKeys } from '../queryKeys';

export const useDriverStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, payload }) => driverService.updateStatus(driverId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSummary });
    }
  });
};

export const useDriverAvailabilityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driverService.updateAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.driverProfile })
  });
};
