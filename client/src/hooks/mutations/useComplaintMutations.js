import { useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService } from '../../services/complaintService';
import { queryKeys } from '../queryKeys';

export const useComplaintCreateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: complaintService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.complaints })
  });
};

export const useComplaintUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, payload }) => complaintService.update(complaintId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.complaints })
  });
};
