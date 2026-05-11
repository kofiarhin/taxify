import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../../services/bookingService';
import { queryKeys } from '../queryKeys';

export const useBookingsQuery = (params) =>
  useQuery({
    queryKey: [...queryKeys.bookings, params],
    queryFn: () => bookingService.list(params)
  });
