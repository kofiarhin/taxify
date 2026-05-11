import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useBookingActionMutation } from '../../hooks/mutations/useBookingMutations';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { bookingService } from '../../services/bookingService';
import { apiErrorMessage } from '../../lib/api';

export function AgentQueuePage() {
  const { data, isLoading, isError, error } = useBookingsQuery({ status: 'QUEUED' });
  const retry = useBookingActionMutation(bookingService.retry);
  const cancel = useBookingActionMutation(bookingService.cancel);

  if (isLoading) return <LoadingBlock lines={4} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const queue = data?.bookings || [];

  if (queue.length === 0) return <EmptyState title="Queue is clear" message="Bookings without an available driver will appear here for retry or cancellation." />;

  return (
    <div className="panel divide-y divide-slate-200">
      {queue.map((booking) => (
        <div key={booking._id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
          <div>
            <p className="font-semibold">{booking.passengerName}</p>
            <p className="text-sm text-slate-600">{booking.pickupAddress} to {booking.dropoffAddress}</p>
          </div>
          <StatusBadge value={booking.status} />
          <button className="button-secondary" onClick={() => retry.mutate(booking._id)} type="button">Retry</button>
          <button className="button-secondary" onClick={() => cancel.mutate(booking._id)} type="button">Cancel</button>
        </div>
      ))}
    </div>
  );
}
