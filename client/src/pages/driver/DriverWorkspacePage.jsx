import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import {
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
} from "../../hooks/mutations/useTripMutations";
import { useMyAssignmentQuery } from "../../hooks/queries/useTripQueries";

const ACTIVE_TRIP_STATUSES = ["ACCEPTED", "IN_PROGRESS", "PAYMENT_PENDING"];

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-right text-sm text-zinc-200">{value ?? "—"}</p>
    </div>
  );
}

function NoAssignment() {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/3 p-8 text-center">
      <div className="mx-auto mb-4 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_8px_rgba(16,185,129,0.1)]" />
      <p className="text-lg text-white">Available for dispatch</p>
      <p className="mt-2 text-sm text-zinc-500">
        You will see a new booking here when dispatch assigns one to you.
      </p>
    </div>
  );
}

export function DriverWorkspacePage() {
  const navigate = useNavigate();
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useMyAssignmentQuery();
  const acceptMut = useAcceptAssignmentMutation();
  const rejectMut = useRejectAssignmentMutation();

  const booking = data?.booking ?? null;
  const attempt = data?.attempt ?? null;

  useEffect(() => {
    if (booking && ACTIVE_TRIP_STATUSES.includes(booking.status)) {
      navigate("/driver/trip", { replace: true });
    }
  }, [booking, navigate]);

  if (isLoading) {
    return (
      <AppShell eyebrow="Driver workspace" title="Drive.">
        <div className="h-40 animate-pulse rounded-3xl bg-white/6" />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell eyebrow="Driver workspace" title="Drive.">
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load assignment data.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Driver workspace" title="Drive.">
      {!booking && <NoAssignment />}

      {booking?.status === "ASSIGNED" && attempt && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
            <p className="mb-4 text-xs uppercase tracking-widest text-zinc-500">New job assigned</p>
            <div className="divide-y divide-white/8">
              <InfoRow label="Reference" value={booking.bookingReference} />
              <InfoRow label="Customer" value={booking.customerName} />
              <InfoRow label="Phone" value={booking.customerPhone} />
              <InfoRow label="Pickup" value={booking.pickupAddress} />
              <InfoRow label="Dropoff" value={booking.dropoffAddress} />
              {booking.specialInstructions && (
                <InfoRow label="Instructions" value={booking.specialInstructions} />
              )}
              {booking.estimatedFare != null && (
                <InfoRow label="Est. fare" value={`GHS ${booking.estimatedFare.toFixed(2)}`} />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-300/15 bg-blue-300/5 p-6">
            <p className="mb-1 text-sm text-zinc-300">Respond before this job expires.</p>
            <p className="mb-5 text-xs text-zinc-500">
              Expires: {new Date(attempt.expiresAt).toLocaleTimeString()}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={acceptMut.isPending}
                onClick={() =>
                  acceptMut.mutate(attempt._id, {
                    onSuccess: () => navigate("/driver/trip"),
                  })
                }
                className="flex-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 py-3 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
              >
                {acceptMut.isPending ? "Accepting…" : "Accept job"}
              </button>
              <div className="flex flex-1 items-center gap-2">
                <input
                  placeholder="Reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
                />
                <button
                  type="button"
                  disabled={rejectMut.isPending}
                  onClick={() =>
                    rejectMut.mutate({ id: attempt._id, reason: rejectReason })
                  }
                  className="rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2.5 text-sm text-red-200 transition hover:-translate-y-px disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>

          {[acceptMut, rejectMut].some((m) => m.isError) && (
            <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
              {[acceptMut, rejectMut].find((m) => m.isError)?.error?.message ?? "An error occurred"}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
