import { useQuery } from '@tanstack/react-query';
import { driverService } from '../../services/driverService';
import { queryKeys } from '../queryKeys';

export const useDriversQuery = () =>
  useQuery({
    queryKey: queryKeys.drivers,
    queryFn: driverService.list
  });

export const useDriverProfileQuery = () =>
  useQuery({
    queryKey: queryKeys.driverProfile,
    queryFn: driverService.me
  });
