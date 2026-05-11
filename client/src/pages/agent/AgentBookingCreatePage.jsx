import { useState } from 'react';
import { apiErrorMessage } from '../../lib/api';
import { useCreateBookingMutation } from '../../hooks/mutations/useBookingMutations';

export function AgentBookingCreatePage() {
  const [form, setForm] = useState({ passengerName: '', passengerPhone: '', pickupAddress: '', dropoffAddress: '' });
  const mutation = useCreateBookingMutation();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate(form);
  };

  return (
    <form className="panel space-y-4 p-5" onSubmit={submit}>
      <h3 className="text-xl font-bold">Create walk-in booking</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field-label">Passenger name</span>
          <input className="field-input" name="passengerName" value={form.passengerName} onChange={update} required />
        </label>
        <label className="field">
          <span className="field-label">Passenger phone</span>
          <input className="field-input" name="passengerPhone" value={form.passengerPhone} onChange={update} />
        </label>
      </div>
      <label className="field">
        <span className="field-label">Pickup address</span>
        <input className="field-input" name="pickupAddress" value={form.pickupAddress} onChange={update} required />
      </label>
      <label className="field">
        <span className="field-label">Dropoff address</span>
        <input className="field-input" name="dropoffAddress" value={form.dropoffAddress} onChange={update} required />
      </label>
      {mutation.isError ? <p className="text-sm text-rose-700">{apiErrorMessage(mutation.error)}</p> : null}
      {mutation.isSuccess ? <p className="text-sm text-teal-800">Booking created: {mutation.data.booking.status.replaceAll('_', ' ')}</p> : null}
      <button className="button-primary" type="submit">Create booking</button>
    </form>
  );
}
