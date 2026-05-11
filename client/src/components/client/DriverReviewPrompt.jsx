import { useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { apiErrorMessage } from '../../lib/api';
import { useDriverReviewMutation } from '../../hooks/mutations/useDriverReviewMutations';

export function DriverReviewPrompt({ booking }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const mutation = useDriverReviewMutation();

  if (!booking || booking.status !== 'COMPLETED' || !booking.assignedDriver) return null;

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate({ bookingId: booking._id, payload: { rating, feedback } });
  };

  return (
    <form className="panel space-y-4 p-5" onSubmit={submit}>
      <div>
        <h3 className="text-lg font-bold tracking-tight">Review your driver</h3>
        <p className="text-sm text-slate-600">Rate the completed ride once. A rating of 5 is best performance.</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`rounded-md border p-2 ${value <= rating ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500'}`}
            onClick={() => setRating(value)}
            aria-label={`Rate ${value}`}
          >
            <Star size={18} weight={value <= rating ? 'fill' : 'regular'} />
          </button>
        ))}
      </div>
      <label className="field">
        <span className="field-label">Feedback</span>
        <textarea className="field-input min-h-24" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
      </label>
      {mutation.isError ? <p className="text-sm font-medium text-rose-700">{apiErrorMessage(mutation.error)}</p> : null}
      {mutation.isSuccess ? <p className="text-sm font-medium text-teal-800">Review submitted.</p> : null}
      <button className="button-primary" type="submit" disabled={mutation.isPending}>
        Submit review
      </button>
    </form>
  );
}
