import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import {
  useConfirmPaymentMutation,
  useEndTripMutation,
  useStartTripMutation,
} from "../../hooks/mutations/useTripMutations";
import { useMyAssignmentQuery } from "../../hooks/queries/useTripQueries";

const FARE_PER_MINUTE = 1.0;

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-right text-sm text-zinc-200">{value ?? "—"}</p>
    </div>
  );
}

function LiveFareMeter({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const startMs = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const liveFare = ((elapsed / 60) * FARE_PER_MINUTE).toFixed(2);

  return (
    <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/5 p-8 text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Elapsed</p>
      <p className="mt-3 font-mono text-5xl tracking-tight text-white">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <p className="mt-6 text-xs text-zinc-600">Running fare</p>
      <p className="mt-1 text-4xl text-emerald-300">GHS {liveFare}</p>
      <p className="mt-2 text-xs text-zinc-600">GHS 1.00 / minute · calculated on end</p>
    </div>
  );
}

function TripSummary({ booking, trip, onReturn }) {
  useEffect(() => {
    const t = setTimeout(onReturn, 4000);
    return () => clearTimeout(t);
  }, [onReturn]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-8 text-center">
        <div className="mx-auto mb-4 h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_0_12px_rgba(16,185,129,0.15)]" />
        <p className="text-xl text-white">Trip complete</p>
        <p className="mt-1 text-sm text-zinc-500">Cash collected and confirmed.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xs text-zinc-600">Duration</p>
          <p className="mt-1 text-xl text-white">{trip?.durationMinutes ?? "—"} min</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xs text-zinc-600">Fare</p>
          <p className="mt-1 text-xl text-emerald-300">
            GHS {trip?.fare?.toFixed(2) ?? booking?.finalFare?.toFixed(2) ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xs text-zinc-600">Commission</p>
          <p className="mt-1 text-xl text-amber-300">GHS {trip?.commissionAmount?.toFixed(2) ?? "—"}</p>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-600">Returning to dispatch in a moment…</p>
    </div>
  );
}

export function DriverTripPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyAssignmentQuery();
  const startMut = useStartTripMutation();
  const endMut = useEndTripMutation();
  const payMut = useConfirmPaymentMutation();

  const booking = data?.booking ?? null;
  const trip = data?.trip ?? null;
  const status = booking?.status;

  useEffect(() => {
    if (payMut.isSuccess) return;
    if (!isLoading && (!booking || booking.status === "ASSIGNED")) {
      navigate("/driver", { replace: true });
    }
  }, [booking, isLoading, payMut.isSuccess, navigate]);

  if (payMut.isSuccess) {
    return (
      <AppShell eyebrow="Driver workspace" title="Trip.">
        <TripSummary
          booking={payMut.data?.booking ?? booking}
          trip={payMut.data?.trip ?? trip}
          onReturn={() => navigate("/driver", { replace: true })}
        />
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell eyebrow="Driver workspace" title="Trip.">
        <div className="h-40 animate-pulse rounded-3xl bg-white/6" />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell eyebrow="Driver workspace" title="Trip.">
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load trip data.
        </div>
      </AppShell>
    );
  }

  if (!booking) return null;

  return (
    <AppShell eyebrow="Driver workspace" title="Trip.">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Current booking</p>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-zinc-400">
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
          </div>
        </div>

        {status === "ACCEPTED" && (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-6">
            <p className="mb-1 text-base text-white">Head to the pickup location.</p>
            <p className="mb-6 text-sm text-zinc-500">
              Start the trip once the customer is in the vehicle.
            </p>
            <button
              type="button"
              disabled={startMut.isPending}
              onClick={() => startMut.mutate(booking._id)}
              className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/10 py-4 text-base text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
            >
              {startMut.isPending ? "Starting…" : "Start trip"}
            </button>
          </div>
        )}

        {status === "IN_PROGRESS" && (
          <div className="space-y-4">
            <LiveFareMeter startedAt={trip?.startedAt} />
            <button
              type="button"
              disabled={endMut.isPending}
              onClick={() => endMut.mutate(booking._id)}
              className="w-full rounded-full border border-red-300/20 bg-red-300/10 py-4 text-base text-red-100 transition hover:-translate-y-px disabled:opacity-50"
            >
              {endMut.isPending ? "Ending trip…" : "End trip"}
            </button>
          </div>
        )}

        {status === "PAYMENT_PENDING" && (
          <div className="rounded-3xl border border-yellow-300/15 bg-yellow-300/5 p-6">
            <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Trip complete</p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
                <p className="text-xs text-zinc-600">Duration</p>
                <p className="mt-1 text-lg text-white">{trip?.durationMinutes ?? "—"} min</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
                <p className="text-xs text-zinc-600">Fare</p>
                <p className="mt-1 text-lg text-emerald-300">
                  GHS {trip?.fare?.toFixed(2) ?? booking.finalFare?.toFixed(2) ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
                <p className="text-xs text-zinc-600">Commission</p>
                <p className="mt-1 text-lg text-amber-300">
                  GHS {trip?.commissionAmount?.toFixed(2) ?? "—"}
                </p>
              </div>
            </div>
            <p className="mt-6 mb-4 text-sm text-zinc-400">
              Collect the cash from the customer, then confirm.
            </p>
            <button
              type="button"
              disabled={payMut.isPending}
              onClick={() => payMut.mutate(booking._id)}
              className="w-full rounded-full border border-emerald-300/30 bg-emerald-300/10 py-4 text-base text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
            >
              {payMut.isPending ? "Confirming…" : "Confirm cash collected"}
            </button>
          </div>
        )}

        {[startMut, endMut, payMut].some((m) => m.isError) && (
          <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
            {[startMut, endMut, payMut].find((m) => m.isError)?.error?.message ?? "An error occurred"}
          </div>
        )}
      </div>
    </AppShell>
  );
}
