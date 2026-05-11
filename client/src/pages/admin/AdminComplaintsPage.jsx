import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useComplaintUpdateMutation } from '../../hooks/mutations/useComplaintMutations';
import { useComplaintsQuery } from '../../hooks/queries/useComplaintQueries';
import { apiErrorMessage } from '../../lib/api';

export function AdminComplaintsPage() {
  const { data, isLoading, isError, error } = useComplaintsQuery();
  const update = useComplaintUpdateMutation();
  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const complaints = data?.complaints || [];

  if (complaints.length === 0) return <EmptyState title="No complaints" message="Client and agent complaints will appear here." />;

  return (
    <div className="panel divide-y divide-slate-200">
      {complaints.map((item) => (
        <div key={item._id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-600">{item.description}</p>
          </div>
          <StatusBadge value={item.status} />
          <div className="flex gap-2">
            <button className="button-secondary" onClick={() => update.mutate({ complaintId: item._id, payload: { status: 'IN_REVIEW' } })} type="button">Review</button>
            <button className="button-secondary" onClick={() => update.mutate({ complaintId: item._id, payload: { status: 'RESOLVED' } })} type="button">Resolve</button>
          </div>
        </div>
      ))}
    </div>
  );
}
