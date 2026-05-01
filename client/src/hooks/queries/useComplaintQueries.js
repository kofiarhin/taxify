import { useQuery } from "@tanstack/react-query";
import { getComplaints } from "../../services/complaintService";
import { queryKeys } from "../queryKeys";

export function useComplaintsQuery(statusFilter = "") {
  return useQuery({
    queryKey: queryKeys.complaints(statusFilter),
    queryFn: () => getComplaints(statusFilter ? { status: statusFilter } : {}),
  });
}

export function useAgentComplaintsQuery() {
  return useQuery({
    queryKey: queryKeys.agentComplaints,
    queryFn: () => getComplaints(),
  });
}
