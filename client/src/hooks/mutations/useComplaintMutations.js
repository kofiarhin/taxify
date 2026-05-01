import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComplaint, resolveComplaint, updateComplaint } from "../../services/complaintService";
import { queryKeys } from "../queryKeys";

async function invalidateComplaintQueries(queryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.agentComplaints });
  await queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot });
  await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
}

export function useCreateComplaintMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComplaint,
    onSuccess: async (...args) => {
      await invalidateComplaintQueries(queryClient);
      if (options.onSuccess) {
        await options.onSuccess(...args);
      }
    },
  });
}

export function useUpdateComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateComplaint(id, payload),
    onSuccess: async () => invalidateComplaintQueries(queryClient),
  });
}

export function useResolveComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }) => resolveComplaint(id, notes),
    onSuccess: async () => invalidateComplaintQueries(queryClient),
  });
}
