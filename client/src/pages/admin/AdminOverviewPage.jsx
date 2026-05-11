import { ErrorState, LoadingBlock } from '../../components/shared/StatusPanel';
import { useDashboardSummaryQuery } from '../../hooks/queries/useDashboardSummaryQuery';
import { apiErrorMessage } from '../../lib/api';

const metricLabels = {
  totalBookings: 'Total bookings',
  completedBookings: 'Completed',
  cancelledBookings: 'Cancelled',
  disputedBookings: 'Disputed',
  queuedBookings: 'Queued',
  totalRevenue: 'Revenue',
  totalCommission: 'Commission',
  activeDrivers: 'Active drivers',
  pendingDriverApprovals: 'Pending approvals',
  averageDriverRating: 'Avg driver rating'
};

export function AdminOverviewPage() {
  const { data, isLoading, isError, error } = useDashboardSummaryQuery();
  if (isLoading) return <LoadingBlock lines={6} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;

  const summary = data?.summary || {};

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Admin analytics</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight">Operations board</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">First-pass dispatch metrics for booking volume, queue pressure, cash revenue, commissions, driver availability, and quality.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(metricLabels).map(([key, label]) => (
          <div className="panel p-4" key={key}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-3 font-mono text-3xl font-black">{summary[key] ?? 'No reviews'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
