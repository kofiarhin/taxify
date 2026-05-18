import { useEffect, useState } from 'react';
import { ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { TripMeter } from '../../components/shared/TripMeter';
import { useDriverAvailabilityMutation } from '../../hooks/mutations/useDriverMutations';
import {
  useAcceptTripMutation,
  useDriverReceivedMutation,
  useEndTripMutation,
  useRejectTripMutation,
  useStartTripMutation
} from '../../hooks/mutations/useTripMutations';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { useDriverProfileQuery } from '../../hooks/queries/useDriverQueries';
import { apiErrorMessage } from '../../lib/api';
import { useElapsedSeconds } from '../../lib/tripMeter';

export function DriverWorkspacePage() {
  const profileQuery = useDriverProfileQuery();
  const bookingsQuery = useBookingsQuery();
  const availability = useDriverAvailabilityMutation();
  const accept = useAcceptTripMutation();
  const reject = useRejectTripMutation();
  const start = useStartTripMutation();
  const end = useEndTripMutation();
  const driverReceived = useDriverReceivedMutation();
  const [tripMetrics, setTripMetrics] = useState({ distanceKm: '', durationMinutes: '' });
  const [durationOverridden, setDurationOverridden] = useState(false);

  const activeBooking = bookingsQuery.data?.bookings?.find((booking) => !['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(booking.status));
  const tripInProgress = activeBooking?.status === 'TRIP_IN_PROGRESS';
  const elapsedForPrefill = useElapsedSeconds(activeBooking?.startedAt, tripInProgress && !durationOverridden);

  useEffect(() => {
    if (!tripInProgress) {
      if (durationOverridden) setDurationOverridden(false);
      return;
    }
    if (durationOverridden) return;
    const minutes = Math.max(1, Math.round(elapsedForPrefill / 60));
    const next = String(minutes);
    setTripMetrics((current) =>
      current.durationMinutes === next ? current : { ...current, durationMinutes: next }
    );
  }, [tripInProgress, durationOverridden, elapsedForPrefill]);

  if (profileQuery.isLoading || bookingsQuery.isLoading) return <LoadingBlock lines={5} />;
  if (profileQuery.isError) return <ErrorState message={apiErrorMessage(profileQuery.error)} />;
  if (bookingsQuery.isError) return <ErrorState message={apiErrorMessage(bookingsQuery.error)} />;

  const profile = profileQuery.data?.profile;
  const ratingText = profile?.reviewCount > 0 ? `${profile.ratingAverage} from ${profile.reviewCount} reviews` : 'No reviews yet';

  const driverPaid = Boolean(activeBooking?.payment?.driverConfirmedAt);
  const showEndForm = activeBooking?.status === 'TRIP_IN_PROGRESS';
  const awaitingClientConfirmation = activeBooking?.status === 'TRIP_ENDED';
  const awaitingDriverPaymentConfirmation = activeBooking?.status === 'AWAITING_DRIVER_PAYMENT_CONFIRMATION';

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
            {tripInProgress ? <TripMeter startedAt={activeBooking.startedAt} fare={activeBooking.fare} /> : null}
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
              {showEndForm ? (
                <form
                  className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    end.mutate({ bookingId: activeBooking._id, payload: tripMetrics });
                  }}
                >
                  <input className="field-input" placeholder="Distance km" value={tripMetrics.distanceKm} onChange={(event) => setTripMetrics((current) => ({ ...current, distanceKm: event.target.value }))} required />
                  <input
                    className="field-input"
                    placeholder="Duration minutes"
                    value={tripMetrics.durationMinutes}
                    onChange={(event) => {
                      setDurationOverridden(true);
                      setTripMetrics((current) => ({ ...current, durationMinutes: event.target.value }));
                    }}
                    required
                  />
                  <button className="button-primary" type="submit">End trip</button>
                </form>
              ) : null}
              {awaitingClientConfirmation ? (
                <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  Waiting for passenger to confirm trip completion.
                </p>
              ) : null}
              {awaitingDriverPaymentConfirmation ? (
                <div className="w-full space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide">
                    <div className="rounded-md bg-teal-50 px-3 py-2 text-teal-800">
                      Passenger: Confirmed
                    </div>
                    <div className={driverPaid ? 'rounded-md bg-teal-50 px-3 py-2 text-teal-800' : 'rounded-md bg-slate-100 px-3 py-2 text-slate-600'}>
                      You: {driverPaid ? 'Received' : 'Pending'}
                    </div>
                  </div>
                  {!driverPaid ? (
                    <button className="button-primary" onClick={() => driverReceived.mutate(activeBooking._id)} type="button">
                      Confirm cash received
                    </button>
                  ) : (
                    <p className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                      Cash receipt recorded. Wrapping up the trip...
                    </p>
                  )}
                </div>
              ) : null}
            </div>
            {activeBooking.fare?.total ? <p className="font-mono text-2xl font-bold">${activeBooking.fare.total}</p> : null}
          </div>
        )}
      </div>
    </section>
  );
}
