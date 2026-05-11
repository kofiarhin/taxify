import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { queryKeys } from '../queryKeys';

export const useDashboardSummaryQuery = () =>
  useQuery({
    queryKey: queryKeys.adminSummary,
    queryFn: dashboardService.adminSummary
  });
