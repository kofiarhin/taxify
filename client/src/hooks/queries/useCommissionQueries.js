import { useQuery } from '@tanstack/react-query';
import { commissionService } from '../../services/commissionService';
import { queryKeys } from '../queryKeys';

export const useCommissionsQuery = (params) =>
  useQuery({
    queryKey: [...queryKeys.commissions, params],
    queryFn: () => commissionService.list(params)
  });
