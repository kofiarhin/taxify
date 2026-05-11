import { useState } from 'react';
import { apiErrorMessage } from '../../lib/api';
import { useCreateBookingMutation } from '../../hooks/mutations/useBookingMutations';

export function ClientBookingCreatePage() {
  const [form, setForm] = useState({ pickupAddress: '', dropoffAddress: '' });
  const mutation = useCreateBookingMutation();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Client ride request</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">Book a ride</h2>
        <p className="mt-4 text-slate-600">The system assigns an approved active driver or places the booking in the queue.</p>
      </div>
      <form className="panel space-y-4 p-6" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Pickup address</span>
          <input className="field-input" name="pickupAddress" value={form.pickupAddress} onChange={update} required />
        </label>
        <label className="field">
          <span className="field-label">Dropoff address</span>
          <input className="field-input" name="dropoffAddress" value={form.dropoffAddress} onChange={update} required />
        </label>
        {mutation.isError ? <p className="text-sm font-medium text-rose-700">{apiErrorMessage(mutation.error)}</p> : null}
        {mutation.isSuccess ? <p className="text-sm font-medium text-teal-800">Booking created: {mutation.data.booking.status.replaceAll('_', ' ')}</p> : null}
        <button className="button-primary" type="submit" disabled={mutation.isPending}>
          Request ride
        </button>
      </form>
    </section>
  );
}
