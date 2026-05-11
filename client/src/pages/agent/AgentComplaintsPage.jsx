import { useState } from 'react';
import { EmptyState, ErrorState, LoadingBlock } from '../../components/shared/StatusPanel';
import { useComplaintCreateMutation } from '../../hooks/mutations/useComplaintMutations';
import { useComplaintsQuery } from '../../hooks/queries/useComplaintQueries';
import { apiErrorMessage } from '../../lib/api';

export function AgentComplaintsPage() {
  const { data, isLoading, isError, error } = useComplaintsQuery();
  const create = useComplaintCreateMutation();
  const [form, setForm] = useState({ title: '', description: '', type: 'COMPLAINT' });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    create.mutate(form);
  };

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} />;

  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <form className="panel space-y-4 p-5" onSubmit={submit}>
        <h2 className="text-2xl font-black tracking-tight">Log complaint</h2>
        <label className="field">
          <span className="field-label">Type</span>
          <select className="field-input" name="type" value={form.type} onChange={update}>
            <option value="COMPLAINT">Complaint</option>
            <option value="DISPUTE">Dispute</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Title</span>
          <input className="field-input" name="title" value={form.title} onChange={update} required />
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <textarea className="field-input min-h-24" name="description" value={form.description} onChange={update} required />
        </label>
        <button className="button-primary" type="submit">Submit</button>
      </form>
      <div className="panel divide-y divide-slate-200">
        {(data?.complaints || []).length === 0 ? <EmptyState title="No complaints" message="Logged complaints and disputes will appear here." /> : null}
        {(data?.complaints || []).map((item) => (
          <div key={item._id} className="p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-600">{item.status} · {item.type}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
