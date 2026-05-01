import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../../components/shared/AppShell";
import { getAllTrips } from "../../services/tripService";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
}

export function AdminTripsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["trips-all"],
    queryFn: () => getAllTrips(),
    refetchInterval: 20000,
  });

  const trips = data?.trips ?? [];

  return (
    <AppShell eyebrow="Admin workspace" title="Trips & payments.">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/6" />
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
          No trips recorded yet.
        </div>
      )}

      {!isLoading && !isError && trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-400">{t.bookingId?.bookingReference ?? "—"}</p>
                  <p className="mt-1 text-base text-white">{t.bookingId?.customerName ?? "—"}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {t.driverId?.vehicleMake} {t.driverId?.vehicleModel} · {t.driverId?.vehiclePlate}
                  </p>
                </div>
                <span
                  className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                    t.paymentStatus === "PAID" ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {t.paymentStatus}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-400 md:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-600">Started</p>
                  <p>{fmt(t.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Ended</p>
                  <p>{fmt(t.endedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Duration</p>
                  <p>{t.durationMinutes != null ? `${t.durationMinutes} min` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Fare / Commission</p>
                  <p className="text-emerald-300">
                    {t.fare != null ? `GHS ${t.fare.toFixed(2)}` : "—"}
                    {t.commissionAmount != null && (
                      <span className="ml-2 text-zinc-500">/ {t.commissionAmount.toFixed(2)}</span>
                    )}
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
