import { useQuery } from '@tanstack/react-query';
import { complaintService } from '../../services/complaintService';
import { queryKeys } from '../queryKeys';

export const useComplaintsQuery = (params) =>
  useQuery({
    queryKey: [...queryKeys.complaints, params],
    queryFn: () => complaintService.list(params)
  });
