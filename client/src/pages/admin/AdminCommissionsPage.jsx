import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useCommissionReviewMutation } from '../../hooks/mutations/useCommissionMutations';
import { useCommissionsQuery } from '../../hooks/queries/useCommissionQueries';
import { apiErrorMessage } from '../../lib/api';

export function AdminCommissionsPage() {
  const { data, isLoading, isError, error } = useCommissionsQuery();
  const review = useCommissionReviewMutation();
  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const commissions = data?.commissions || [];

  if (commissions.length === 0) return <EmptyState title="No commission records" message="Completed trips will generate 10% commission records." />;

  return (
    <div className="panel divide-y divide-slate-200">
      {commissions.map((item) => (
        <div key={item._id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <div>
            <p className="font-semibold">{item.driver?.user?.name || 'Driver'}</p>
            <p className="text-sm text-slate-600">{item.month} · receipt {item.receiptReference || 'not submitted'}</p>
          </div>
          <p className="font-mono text-xl font-bold">${item.commissionAmount}</p>
          <StatusBadge value={item.status} />
          <div className="flex gap-2">
            <button className="button-secondary" onClick={() => review.mutate({ commissionId: item._id, payload: { status: 'APPROVED' } })} type="button">Approve</button>
            <button className="button-secondary" onClick={() => review.mutate({ commissionId: item._id, payload: { status: 'REJECTED' } })} type="button">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
