import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveDriver,
  deactivateDriver,
  reactivateDriver,
  suspendDriver,
} from "../../services/driverService";
import { queryKeys } from "../queryKeys";

async function invalidateDriverQueries(queryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.driversPending });
  await queryClient.invalidateQueries({ queryKey: queryKeys.driversAll });
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

export function useApproveDriverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveDriver,
    onSuccess: async () => invalidateDriverQueries(queryClient),
  });
}

export function useSuspendDriverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => suspendDriver(id, reason),
    onSuccess: async () => invalidateDriverQueries(queryClient),
  });
}

export function useReactivateDriverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateDriver,
    onSuccess: async () => invalidateDriverQueries(queryClient),
  });
}

export function useDeactivateDriverMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => deactivateDriver(id, reason),
    onSuccess: async () => invalidateDriverQueries(queryClient),
  });
}
