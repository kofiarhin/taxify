import { AppShell } from "../../components/shared/AppShell";
import { useDriverTripsQuery } from "../../hooks/queries/useTripQueries";

function fmt(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString();
}

export function DriverTripsPage() {
  const { data, isLoading, isError } = useDriverTripsQuery();
  const trips = data?.trips ?? [];
  const total = trips.reduce((sum, trip) => sum + (trip.fare ?? 0), 0);
  const commission = trips.reduce((sum, trip) => sum + (trip.commissionAmount ?? 0), 0);

  return (
    <AppShell eyebrow="Driver workspace" title="Trip history.">
      {trips.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-600">Trips</p>
            <p className="mt-2 text-2xl text-white">{trips.length}</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-600">Revenue</p>
            <p className="mt-2 text-2xl text-emerald-300">GHS {total.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/3 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-600">Commission</p>
            <p className="mt-2 text-2xl text-amber-300">GHS {commission.toFixed(2)}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load trips.
        </div>
      )}

      {!isLoading && !isError && trips.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No trips recorded yet. Complete a trip to see it here.
        </div>
      )}

      {!isLoading && !isError && trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-400">{trip.bookingId?.bookingReference ?? "--"}</p>
                  <p className="mt-1 text-base text-white">{trip.bookingId?.customerName ?? "--"}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {trip.bookingId?.pickupAddress} {"->"} {trip.bookingId?.dropoffAddress}
                  </p>
                </div>
                <span
                  className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                    trip.paymentStatus === "PAID" ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {trip.paymentStatus}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-600">Started</p>
                  <p className="text-zinc-400">{fmt(trip.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Duration</p>
                  <p className="text-zinc-400">{trip.durationMinutes != null ? `${trip.durationMinutes} min` : "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Fare</p>
                  <p className="text-emerald-300">{trip.fare != null ? `GHS ${trip.fare.toFixed(2)}` : "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Commission</p>
                  <p className="text-amber-300">
                    {trip.commissionAmount != null ? `GHS ${trip.commissionAmount.toFixed(2)}` : "--"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
