import { useQuery } from "@tanstack/react-query";
import { AppShell } from "../../components/shared/AppShell";
import { getDashboardSummary } from "../../services/dashboardService";

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-[1.8rem] border border-white/8 bg-white/3 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className={`mt-3 text-3xl tracking-tight ${accent ?? "text-white"}`}>{value ?? "—"}</p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

export function AdminOverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    refetchInterval: 15000,
  });

  return (
    <AppShell eyebrow="Admin workspace" title="Operations overview.">
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[1.8rem] bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
          Unable to load dashboard metrics. Confirm the backend is running.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Bookings today" value={data.bookingsToday} />
            <KpiCard label="Active trips" value={data.activeTrips} accent="text-emerald-300" />
            <KpiCard label="Completed today" value={data.completedToday} />
            <KpiCard label="Queue depth" value={data.queueCount} accent={data.queueCount > 0 ? "text-amber-300" : "text-white"} />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard
              label="Cash collected today"
              value={`GHS ${data.cashCollectedToday?.toFixed(2) ?? "0.00"}`}
              accent="text-emerald-300"
            />
            <KpiCard
              label="Commission due (month)"
              value={`GHS ${data.commissionDueThisMonth?.toFixed(2) ?? "0.00"}`}
              accent={data.commissionDueThisMonth > 0 ? "text-amber-300" : "text-white"}
            />
            <KpiCard label="Suspended drivers" value={data.suspendedDrivers} accent={data.suspendedDrivers > 0 ? "text-red-300" : "text-white"} />
            <KpiCard label="Open complaints" value={data.openComplaints} accent={data.openComplaints > 0 ? "text-amber-300" : "text-white"} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Active drivers" value={data.activeDrivers} />
            <KpiCard
              label="Acceptance rate"
              value={`${data.driverAcceptanceRate}%`}
              sub={`Rejection: ${data.driverRejectionRate}%`}
              accent={data.driverAcceptanceRate >= 70 ? "text-emerald-300" : "text-amber-300"}
            />
            <KpiCard
              label="Avg queue wait"
              value={`${data.avgQueueWaitMinutes} min`}
              accent={data.avgQueueWaitMinutes > 10 ? "text-amber-300" : "text-white"}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
