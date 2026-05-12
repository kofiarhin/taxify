import { useState } from 'react';
import { DriverReviewPrompt } from '../../components/client/DriverReviewPrompt';
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { TripMeter } from '../../components/shared/TripMeter';
import { BOOKING_STATUS } from '../../constants/statuses';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import {
  useClientArrivedMutation,
  useClientPaidMutation
} from '../../hooks/mutations/useTripMutations';
import { useComplaintCreateMutation } from '../../hooks/mutations/useComplaintMutations';
import { apiErrorMessage } from '../../lib/api';

export function ClientCurrentBookingPage() {
  const { data, isLoading, isError, error } = useBookingsQuery();
  const current = data?.bookings?.find((booking) => !['COMPLETED', 'CANCELLED'].includes(booking.status)) || data?.bookings?.[0];
  const arrived = useClientArrivedMutation();
  const paid = useClientPaidMutation();
  const complaint = useComplaintCreateMutation();
  const [issue, setIssue] = useState('');

  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  if (!current) return <EmptyState title="No ride yet" message="Create a booking to track assignment, trip progress, fare, and payment confirmation." />;

  const submitComplaint = (event) => {
    event.preventDefault();
    complaint.mutate({ booking: current._id, type: 'COMPLAINT', title: 'Client ride issue', description: issue });
  };

  const clientArrived = Boolean(current.arrival?.clientMarkedAt);
  const driverArrived = Boolean(current.arrival?.driverMarkedAt);
  const clientPaid = Boolean(current.payment?.clientConfirmedAt);
  const driverPaid = Boolean(current.payment?.driverConfirmedAt);
  const canMarkArrival =
    [BOOKING_STATUS.TRIP_IN_PROGRESS, BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK].includes(current.status) && !clientArrived;
  const awaitingPayment = current.status === BOOKING_STATUS.AWAITING_PAYMENT;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <StatusBadge value={current.status} />
            <h2 className="mt-3 text-3xl font-black tracking-tight">{current.pickupAddress} to {current.dropoffAddress}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Driver: {current.assignedDriver?.user?.name || 'Awaiting assignment'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Fare</p>
            <p className="font-mono text-3xl font-bold">${current.fare?.total || 0}</p>
          </div>
        </div>
        {current.status === BOOKING_STATUS.TRIP_IN_PROGRESS ? (
          <div className="mt-6">
            <TripMeter startedAt={current.startedAt} fare={current.fare} />
          </div>
        ) : null}
        {canMarkArrival ? (
          <button className="button-primary mt-6" onClick={() => arrived.mutate(current._id)} type="button">
            I have arrived
          </button>
        ) : null}
        {current.status === BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK && clientArrived && !driverArrived ? (
          <p className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Waiting for driver to end the trip and confirm the fare.
          </p>
        ) : null}
        {awaitingPayment ? (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide">
              <div className={clientPaid ? 'rounded-md bg-teal-50 px-3 py-2 text-teal-800' : 'rounded-md bg-slate-100 px-3 py-2 text-slate-600'}>
                You: {clientPaid ? 'Paid' : 'Pending'}
              </div>
              <div className={driverPaid ? 'rounded-md bg-teal-50 px-3 py-2 text-teal-800' : 'rounded-md bg-slate-100 px-3 py-2 text-slate-600'}>
                Driver: {driverPaid ? 'Received' : 'Pending'}
              </div>
            </div>
            {!clientPaid ? (
              <button className="button-primary" onClick={() => paid.mutate(current._id)} type="button">
                Confirm cash paid
              </button>
            ) : driverPaid ? (
              <p className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                Driver confirmed cash received. Wrapping up your ride...
              </p>
            ) : (
              <p className="text-sm text-slate-600">Waiting for driver to confirm they received the cash.</p>
            )}
          </div>
        ) : null}
      </section>
      <DriverReviewPrompt booking={current} />
      <form className="panel space-y-3 p-5" onSubmit={submitComplaint}>
        <label className="field">
          <span className="field-label">Report an issue</span>
          <textarea className="field-input min-h-24" value={issue} onChange={(event) => setIssue(event.target.value)} />
        </label>
        <button className="button-secondary" type="submit" disabled={!issue || complaint.isPending}>
          Submit complaint
        </button>
      </form>
    </div>
  );
}
