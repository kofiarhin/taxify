import { useState } from 'react';
import { DriverReviewPrompt } from '../../components/client/DriverReviewPrompt';
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { BOOKING_STATUS } from '../../constants/statuses';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { useClientConfirmMutation } from '../../hooks/mutations/useTripMutations';
import { useComplaintCreateMutation } from '../../hooks/mutations/useComplaintMutations';
import { apiErrorMessage } from '../../lib/api';

export function ClientCurrentBookingPage() {
  const { data, isLoading, isError, error } = useBookingsQuery();
  const current = data?.bookings?.find((booking) => !['COMPLETED', 'CANCELLED'].includes(booking.status)) || data?.bookings?.[0];
  const confirm = useClientConfirmMutation();
  const complaint = useComplaintCreateMutation();
  const [issue, setIssue] = useState('');

  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  if (!current) return <EmptyState title="No ride yet" message="Create a booking to track assignment, trip progress, fare, and payment confirmation." />;

  const submitComplaint = (event) => {
    event.preventDefault();
    complaint.mutate({ booking: current._id, type: 'COMPLAINT', title: 'Client ride issue', description: issue });
  };

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
        {current.status === BOOKING_STATUS.AWAITING_CLIENT_CONFIRMATION ? (
          <button className="button-primary mt-6" onClick={() => confirm.mutate(current._id)} type="button">
            Confirm trip completion
          </button>
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
