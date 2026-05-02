import { useMemo, useState } from "react";
import { CheckCircle, X } from "@phosphor-icons/react";
import { useSubmitDriverReviewMutation } from "../../hooks/mutations/useDriverReviewMutations";

const ratingLabels = {
  1: "Poor",
  2: "Below expectations",
  3: "Acceptable",
  4: "Good",
  5: "Excellent",
};

function getDriverLabel(driverName, driverVehicle) {
  if (driverName && driverVehicle) return `${driverName} - ${driverVehicle}`;
  return driverName || driverVehicle || "Assigned driver";
}

export function DriverReviewPrompt({ bookingId, driverName, driverVehicle, review }) {
  const [rating, setRating] = useState(review?.rating ?? null);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [localError, setLocalError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const reviewMutation = useSubmitDriverReviewMutation();

  const submitted = review?.submitted || reviewMutation.isSuccess;
  const submittedRating = reviewMutation.data?.review?.rating ?? review?.rating ?? rating;
  const driverLabel = useMemo(
    () => getDriverLabel(driverName, driverVehicle),
    [driverName, driverVehicle]
  );

  if (!review || (!review.eligible && !review.submitted)) return null;
  if (dismissed && !submitted) return null;

  if (submitted) {
    return (
      <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/8 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle size={24} className="mt-1 shrink-0 text-emerald-300" weight="duotone" />
          <div>
            <p className="text-lg text-white">Driver review submitted</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              You rated {driverLabel} {submittedRating} out of 5.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (!rating) {
      setLocalError("Select a rating before submitting.");
      return;
    }

    if (comment.length > 500) {
      setLocalError("Comment must be 500 characters or fewer.");
      return;
    }

    reviewMutation.mutate({ bookingId, rating, comment });
  }

  return (
    <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/8 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Driver review</p>
          <p className="mt-3 text-xl tracking-tight text-white">How was your driver?</p>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-zinc-400">
            Rate {driverLabel} after this completed trip.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss review prompt"
          onClick={() => setDismissed(true)}
          className="rounded-full border border-white/10 p-2 text-zinc-400 transition hover:-translate-y-px hover:text-white active:scale-[0.98]"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Rating</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`Rate driver ${value} out of 5`}
                  aria-pressed={selected}
                  onClick={() => {
                    setRating(value);
                    setLocalError("");
                  }}
                  className={`h-16 min-w-0 rounded-2xl border text-center transition active:scale-[0.98] ${
                    selected
                      ? "border-emerald-300/50 bg-emerald-300/18 text-emerald-50"
                      : "border-white/10 bg-zinc-950/30 text-zinc-400 hover:-translate-y-px hover:border-white/20 hover:text-zinc-100"
                  }`}
                >
                  <span className="block font-mono text-xl leading-none">{value}</span>
                  <span className="mt-1 block truncate px-1 text-[0.65rem] text-current opacity-75">
                    {ratingLabels[value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="driver-review-comment" className="text-sm text-zinc-300">
            Comment
          </label>
          <textarea
            id="driver-review-comment"
            value={comment}
            maxLength={500}
            onChange={(event) => {
              setComment(event.target.value);
              setLocalError("");
            }}
            placeholder="Optional note about the ride"
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/40"
          />
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="text-zinc-600">Keep it specific and useful for operations.</p>
            <p className="font-mono text-zinc-600">{comment.length}/500</p>
          </div>
        </div>

        {(localError || reviewMutation.isError) && (
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            {localError || reviewMutation.error?.message || "Could not submit review."}
          </p>
        )}

        <button
          type="submit"
          disabled={!rating || reviewMutation.isPending}
          className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/12 py-3 text-sm text-emerald-50 transition hover:-translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {reviewMutation.isPending ? "Submitting review..." : "Submit driver review"}
        </button>
      </form>
    </section>
  );
}
