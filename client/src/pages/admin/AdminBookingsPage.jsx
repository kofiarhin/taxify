import { ArrowsClockwise, CheckCircle, Prohibit, WarningCircle } from '@phosphor-icons/react';
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useBookingActionMutation } from '../../hooks/mutations/useBookingMutations';
import { useBookingsQuery } from '../../hooks/queries/useBookingQueries';
import { bookingService } from '../../services/bookingService';
import { apiErrorMessage } from '../../lib/api';

const preTripStatuses = ['PENDING_ASSIGNMENT', 'QUEUED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED'];
const retryStatuses = ['PENDING_ASSIGNMENT', 'QUEUED'];
const completeStatuses = ['AWAITING_DRIVER_PAYMENT_CONFIRMATION', 'PAID'];

export function AdminBookingsPage() {
  const { data, isLoading, isError, error } = useBookingsQuery();
  const retry = useBookingActionMutation(bookingService.retry);
  const reassign = useBookingActionMutation(bookingService.reassign);
  const cancel = useBookingActionMutation(bookingService.cancel);
  const complete = useBookingActionMutation(bookingService.complete);
  const dispute = useBookingActionMutation(bookingService.dispute);

  if (isLoading) return <LoadingBlock lines={6} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;

  const bookings = data?.bookings || [];
  const mutations = [retry, reassign, cancel, complete, dispute];
  const actionError = mutations.find((mutation) => mutation.isError)?.error;
  const actionPending = mutations.some((mutation) => mutation.isPending);

  if (bookings.length === 0) return <EmptyState title="No bookings" message="Client and agent bookings will appear here." />;

  return (
    <section className="space-y-4">
      {actionError ? <ErrorState message={apiErrorMessage(actionError)} /> : null}
      <div className="panel divide-y divide-slate-200">
        {bookings.map((booking) => {
          const canRetry = retryStatuses.includes(booking.status);
          const canReassign = preTripStatuses.includes(booking.status);
          const canCancel = preTripStatuses.includes(booking.status);
          const canComplete = completeStatuses.includes(booking.status);
          const fareTotal = Number(booking.fare?.total || 0).toFixed(2);

          return (
            <div
              aria-label={`Booking ${booking.pickupAddress} to ${booking.dropoffAddress}`}
              className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center"
              key={booking._id}
              role="region"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold">
                  {booking.pickupAddress} to {booking.dropoffAddress}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {booking.source} / {booking.assignedDriver?.user?.name || 'No driver assigned'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge value={booking.status} />
                <p className="font-mono text-lg font-bold">${fareTotal}</p>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {canRetry ? (
                  <button className="button-secondary" disabled={actionPending} onClick={() => retry.mutate(booking._id)} type="button">
                    <ArrowsClockwise size={17} weight="bold" />
                    Retry
                  </button>
                ) : null}
                {canReassign ? (
                  <button className="button-secondary" disabled={actionPending} onClick={() => reassign.mutate(booking._id)} type="button">
                    <ArrowsClockwise size={17} weight="bold" />
                    Reassign
                  </button>
                ) : null}
                {canComplete ? (
                  <button className="button-secondary" disabled={actionPending} onClick={() => complete.mutate(booking._id)} type="button">
                    <CheckCircle size={17} weight="bold" />
                    Complete
                  </button>
                ) : null}
                {canCancel ? (
                  <button className="button-secondary" disabled={actionPending} onClick={() => cancel.mutate(booking._id)} type="button">
                    <Prohibit size={17} weight="bold" />
                    Cancel
                  </button>
                ) : null}
                {booking.status !== 'DISPUTED' ? (
                  <button className="button-secondary" disabled={actionPending} onClick={() => dispute.mutate(booking._id)} type="button">
                    <WarningCircle size={17} weight="bold" />
                    Dispute
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
