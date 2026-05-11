import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { apiErrorMessage } from '../../lib/api';

export function ClientDashboardPage() {
  const { data, isLoading, isError, error } = useBookingsQuery();
  if (isLoading) return <LoadingBlock lines={4} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;

  const bookings = data?.bookings || [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Client dashboard</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Ride history</h2>
        </div>
        <Link className="button-primary" to="/client/book">Book ride</Link>
      </div>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" message="Create your first ride request to start assignment and trip tracking." />
      ) : (
        <div className="panel divide-y divide-slate-200">
          {bookings.map((booking) => (
            <div key={booking._id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-semibold">{booking.pickupAddress} to {booking.dropoffAddress}</p>
                <p className="text-sm text-slate-600">{booking.assignedDriver?.user?.name || 'No driver assigned'}</p>
              </div>
              <StatusBadge value={booking.status} />
              <p className="font-mono font-bold">${booking.fare?.total || 0}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
