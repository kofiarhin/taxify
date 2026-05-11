import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useDriverStatusMutation } from '../../hooks/mutations/useDriverMutations';
import { useDriversQuery } from '../../hooks/queries/useDriverQueries';
import { apiErrorMessage } from '../../lib/api';

export function AdminDriversPage() {
  const { data, isLoading, isError, error } = useDriversQuery();
  const status = useDriverStatusMutation();
  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const drivers = data?.drivers || [];

  if (drivers.length === 0) return <EmptyState title="No drivers" message="Driver registrations and onboarding submissions will appear here." />;

  return (
    <div className="panel divide-y divide-slate-200">
      {drivers.map((driver) => (
        <div key={driver._id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-center">
          <div>
            <p className="font-semibold">{driver.user?.name}</p>
            <p className="text-sm text-slate-600">{driver.vehicleMake || 'Vehicle pending'} {driver.vehiclePlate || ''}</p>
          </div>
          <StatusBadge value={driver.approvalStatus} />
          <StatusBadge value={driver.lifecycleStatus} />
          <p className="text-sm font-semibold">{driver.reviewCount > 0 ? `${driver.ratingAverage} rating` : 'No reviews yet'}</p>
          <div className="flex gap-2">
            <button className="button-secondary" onClick={() => status.mutate({ driverId: driver._id, payload: { approvalStatus: 'APPROVED', lifecycleStatus: 'ACTIVE' } })} type="button">Approve</button>
            <button className="button-secondary" onClick={() => status.mutate({ driverId: driver._id, payload: { lifecycleStatus: 'SUSPENDED' } })} type="button">Suspend</button>
          </div>
        </div>
      ))}
    </div>
  );
}
