import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useBookingActionMutation } from '../../hooks/mutations/useBookingMutations';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { bookingService } from '../../services/bookingService';
import { apiErrorMessage } from '../../lib/api';

export function AdminBookingsPage() {
  const { data, isLoading, isError, error } = useBookingsQuery();
  const dispute = useBookingActionMutation(bookingService.dispute);
  if (isLoading) return <LoadingBlock lines={6} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const bookings = data?.bookings || [];

  if (bookings.length === 0) return <EmptyState title="No bookings" message="Client and agent bookings will appear here." />;

  return (
    <div className="panel divide-y divide-slate-200">
      {bookings.map((booking) => (
        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center" key={booking._id}>
          <div>
            <p className="font-semibold">{booking.pickupAddress} to {booking.dropoffAddress}</p>
            <p className="text-sm text-slate-600">{booking.source} · {booking.assignedDriver?.user?.name || 'No driver'}</p>
          </div>
          <StatusBadge value={booking.status} />
          <p className="font-mono font-bold">${booking.fare?.total || 0}</p>
          <button className="button-secondary" onClick={() => dispute.mutate(booking._id)} type="button">Mark disputed</button>
        </div>
      ))}
    </div>
  );
}
