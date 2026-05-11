import { useState } from 'react';
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/shared/StatusPanel';
import { useCommissionReceiptMutation } from '../../hooks/mutations/useCommissionMutations';
import { useCommissionsQuery } from '../../hooks/queries/useCommissionQueries';
import { apiErrorMessage } from '../../lib/api';

export function DriverCommissionsPage() {
  const { data, isLoading, isError, error } = useCommissionsQuery();
  const receipt = useCommissionReceiptMutation();
  const [reference, setReference] = useState('');

  if (isLoading) return <LoadingBlock lines={5} />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;
  const commissions = data?.commissions || [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Cash commission</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">Monthly obligations</h2>
      </div>
      {commissions.length === 0 ? (
        <EmptyState title="No commission due" message="Completed cash trips will generate 10% driver commission records." />
      ) : (
        <div className="panel divide-y divide-slate-200">
          {commissions.map((item) => (
            <div key={item._id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
              <div>
                <p className="font-semibold">{item.month}</p>
                <p className="text-sm text-slate-600">Fare ${item.fareTotal}</p>
              </div>
              <p className="font-mono text-xl font-bold">${item.commissionAmount}</p>
              <input className="field-input" placeholder="Receipt reference" value={reference} onChange={(event) => setReference(event.target.value)} />
              <button className="button-secondary" type="button" onClick={() => receipt.mutate({ commissionId: item._id, payload: { receiptReference: reference } })}>Submit receipt</button>
              <StatusBadge value={item.status} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
