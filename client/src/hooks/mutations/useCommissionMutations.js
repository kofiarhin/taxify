import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionService } from '../../services/commissionService';
import { queryKeys } from '../queryKeys';

export const useCommissionReceiptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commissionId, payload }) => commissionService.submitReceipt(commissionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
  });
};

export const useCommissionReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commissionId, payload }) => commissionService.reviewReceipt(commissionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
  });
};
