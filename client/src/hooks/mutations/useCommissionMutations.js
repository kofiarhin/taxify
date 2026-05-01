import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveCommission,
  rejectCommission,
  settleCommission,
  submitReceipt,
} from "../../services/commissionService";
import { queryKeys } from "../queryKeys";

async function invalidateCommissionQueries(queryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.driverCommissions });
  await queryClient.invalidateQueries({ queryKey: queryKeys.commissionsAll });
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

export function useSubmitReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }) => submitReceipt(id, file),
    onSuccess: async () => invalidateCommissionQueries(queryClient),
  });
}

export function useApproveCommissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes, settleImmediately }) =>
      approveCommission(id, notes, settleImmediately),
    onSuccess: async () => invalidateCommissionQueries(queryClient),
  });
}

export function useRejectCommissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }) => rejectCommission(id, notes),
    onSuccess: async () => invalidateCommissionQueries(queryClient),
  });
}

export function useSettleCommissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }) => settleCommission(id, notes),
    onSuccess: async () => invalidateCommissionQueries(queryClient),
  });
}
