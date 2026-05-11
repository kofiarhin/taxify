import { useState } from 'react';
import { ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useDriverAvailabilityMutation } from '../../hooks/mutations/useDriverMutations';
import {
  useAcceptTripMutation,
  useEndTripMutation,
  usePaymentConfirmMutation,
  useRejectTripMutation,
  useStartTripMutation
} from '../../hooks/mutations/useTripMutations';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { useDriverProfileQuery } from '../../hooks/queries/useDriverQueries';
import { apiErrorMessage } from '../../lib/api';

export function DriverWorkspacePage() {
  const profileQuery = useDriverProfileQuery();
  const bookingsQuery = useBookingsQuery();
  const availability = useDriverAvailabilityMutation();
  const accept = useAcceptTripMutation();
  const reject = useRejectTripMutation();
  const start = useStartTripMutation();
  const end = useEndTripMutation();
  const confirmPayment = usePaymentConfirmMutation();
  const [tripMetrics, setTripMetrics] = useState({ distanceKm: '', durationMinutes: '' });

  if (profileQuery.isLoading || bookingsQuery.isLoading) return <LoadingBlock lines={5} />;
  if (profileQuery.isError) return <ErrorState message={apiErrorMessage(profileQuery.error)} />;
  if (bookingsQuery.isError) return <ErrorState message={apiErrorMessage(bookingsQuery.error)} />;

  const profile = profileQuery.data?.profile;
  const activeBooking = bookingsQuery.data?.bookings?.find((booking) => !['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(booking.status));

  const ratingText = profile?.reviewCount > 0 ? `${profile.ratingAverage} from ${profile.reviewCount} reviews` : 'No reviews yet';

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="panel space-y-5 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Driver console</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">{profile?.user?.name}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approval</p>
            <StatusBadge value={profile?.approvalStatus} />
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Availability</p>
            <StatusBadge value={profile?.lifecycleStatus} />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-700">Rating: {ratingText}</p>
        <div className="flex flex-wrap gap-2">
          <button className="button-primary" onClick={() => availability.mutate({ lifecycleStatus: 'ACTIVE' })} type="button">Go active</button>
          <button className="button-secondary" onClick={() => availability.mutate({ lifecycleStatus: 'OFFLINE' })} type="button">Go offline</button>
        </div>
      </div>
      <div className="panel space-y-5 p-6">
        <h3 className="text-2xl font-black tracking-tight">Assigned trip</h3>
        {!activeBooking ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No active booking assigned.</p>
        ) : (
          <div className="space-y-4">
            <StatusBadge value={activeBooking.status} />
            <p className="text-lg font-semibold">{activeBooking.pickupAddress} to {activeBooking.dropoffAddress}</p>
            <p className="text-sm text-slate-600">Passenger: {activeBooking.passengerName}</p>
            <div className="flex flex-wrap gap-2">
              {activeBooking.status === 'DRIVER_ASSIGNED' ? (
                <>
                  <button className="button-primary" onClick={() => accept.mutate(activeBooking._id)} type="button">Accept</button>
                  <button className="button-secondary" onClick={() => reject.mutate(activeBooking._id)} type="button">Reject</button>
                </>
              ) : null}
              {activeBooking.status === 'DRIVER_ACCEPTED' ? (
                <button className="button-primary" onClick={() => start.mutate(activeBooking._id)} type="button">Start trip</button>
              ) : null}
              {activeBooking.status === 'TRIP_IN_PROGRESS' ? (
                <form
                  className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    end.mutate({ bookingId: activeBooking._id, payload: tripMetrics });
                  }}
                >
                  <input className="field-input" placeholder="Distance km" value={tripMetrics.distanceKm} onChange={(event) => setTripMetrics((current) => ({ ...current, distanceKm: event.target.value }))} required />
                  <input className="field-input" placeholder="Duration minutes" value={tripMetrics.durationMinutes} onChange={(event) => setTripMetrics((current) => ({ ...current, durationMinutes: event.target.value }))} required />
                  <button className="button-primary" type="submit">End trip</button>
                </form>
              ) : null}
              {activeBooking.status === 'AWAITING_DRIVER_PAYMENT_CONFIRMATION' ? (
                <button className="button-primary" onClick={() => confirmPayment.mutate(activeBooking._id)} type="button">Confirm cash received</button>
              ) : null}
            </div>
            {activeBooking.fare?.total ? <p className="font-mono text-2xl font-bold">${activeBooking.fare.total}</p> : null}
          </div>
        )}
      </div>
    </section>
  );
}
