import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "../../components/shared/AppShell";
import {
  acceptAssignment,
  confirmPayment,
  endTrip,
  getMyAssignment,
  rejectAssignment,
  startTrip,
} from "../../services/tripService";
import { BOOKING_STATUS_COLORS } from "../../constants/statuses";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-sm text-right text-zinc-200">{value ?? "—"}</p>
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
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-assignment"],
    queryFn: getMyAssignment,
    refetchInterval: 8000,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["my-assignment"] });
  }

  const acceptMut = useMutation({ mutationFn: (id) => acceptAssignment(id), onSuccess: invalidate });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => rejectAssignment(id, reason),
    onSuccess: invalidate,
  });
  const startMut = useMutation({ mutationFn: (id) => startTrip(id), onSuccess: invalidate });
  const endMut = useMutation({
    mutationFn: (id) => endTrip(id),
    onSuccess: invalidate,
  });
  const payMut = useMutation({ mutationFn: (id) => confirmPayment(id), onSuccess: invalidate });

  const booking = data?.booking ?? null;
  const attempt = data?.attempt ?? null;
  const status = booking?.status;

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

      {booking && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Current booking</p>
              <span
                className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                  BOOKING_STATUS_COLORS[status] ?? "text-zinc-400"
                }`}
              >
                {status}
              </span>
            </div>

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
              {booking.finalFare != null && (
                <InfoRow label="Final fare" value={`GHS ${booking.finalFare.toFixed(2)}`} />
              )}
            </div>
          </div>

          {/* ASSIGNED: accept or reject */}
          {status === "ASSIGNED" && attempt && (
            <div className="rounded-3xl border border-blue-300/15 bg-blue-300/5 p-6">
              <p className="mb-1 text-sm text-zinc-300">New job assigned — respond before it expires.</p>
              <p className="mb-5 text-xs text-zinc-500">
                Expires: {new Date(attempt.expiresAt).toLocaleTimeString()}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={acceptMut.isPending}
                  onClick={() => acceptMut.mutate(attempt._id)}
                  className="flex-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 py-3 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                >
                  {acceptMut.isPending ? "Accepting..." : "Accept job"}
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
                    onClick={() => rejectMut.mutate({ id: attempt._id, reason: rejectReason })}
                    className="rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2.5 text-sm text-red-200 transition hover:-translate-y-px disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACCEPTED: start trip */}
          {status === "ACCEPTED" && (
            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-6">
              <p className="mb-4 text-sm text-zinc-300">Job accepted. Head to the pickup location and start the trip when ready.</p>
              <button
                type="button"
                disabled={startMut.isPending}
                onClick={() => startMut.mutate(booking._id)}
                className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/10 py-4 text-base text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
              >
                {startMut.isPending ? "Starting..." : "Start trip"}
              </button>
            </div>
          )}

          {/* IN_PROGRESS: end trip */}
          {status === "IN_PROGRESS" && (
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-6">
              <p className="mb-2 text-sm text-zinc-300">
                Trip in progress. When you end it, the system will calculate the fare automatically.
              </p>
              <p className="mb-5 text-xs text-zinc-500">Current pricing rule: 1 minute = GHS 1.00</p>
              <button
                type="button"
                disabled={endMut.isPending}
                onClick={() => endMut.mutate(booking._id)}
                className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/10 py-4 text-base text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
              >
                {endMut.isPending ? "Ending trip..." : "End trip"}
              </button>
            </div>
          )}

          {/* PAYMENT_PENDING: confirm cash */}
          {status === "PAYMENT_PENDING" && (
            <div className="rounded-3xl border border-yellow-300/15 bg-yellow-300/5 p-6">
              <p className="mb-2 text-sm text-zinc-300">Trip complete. Collect cash from the customer.</p>
              <p className="mb-5 text-3xl tracking-tight text-white">
                GHS {booking.finalFare?.toFixed(2) ?? "—"}
              </p>
              <button
                type="button"
                disabled={payMut.isPending}
                onClick={() => payMut.mutate(booking._id)}
                className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/10 py-4 text-base text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
              >
                {payMut.isPending ? "Confirming..." : "Confirm cash collected"}
              </button>
            </div>
          )}

          {/* PAID: complete */}
          {status === "PAID" && (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-6 text-center">
              <div className="mx-auto mb-3 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_8px_rgba(16,185,129,0.15)]" />
              <p className="text-lg text-white">Trip complete and paid</p>
              <p className="mt-2 text-sm text-zinc-500">
                Fare: GHS {booking.finalFare?.toFixed(2)}. Refreshing to available state…
              </p>
            </div>
          )}

          {[acceptMut, rejectMut, startMut, endMut, payMut].some((m) => m.isError) && (
            <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
              {[acceptMut, rejectMut, startMut, endMut, payMut].find((m) => m.isError)?.error?.message ?? "An error occurred"}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
