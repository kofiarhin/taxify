import { AppShell } from "../../components/shared/AppShell";
import { StatusPanel } from "../../components/shared/StatusPanel";

export function AdminOverviewPage() {
  return (
    <AppShell
      eyebrow="Admin workspace"
      title="Control the network."
      summary="This foundation slice wires the admin shell, session recovery, and initial user-management path. Booking dispatch, trip flow, and commission operations land in the next implementation slices."
    >
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-white/8 bg-zinc-950/40 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Implementation status</p>
            <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <StatusPanel
                label="Backend"
                value="Foundation live"
                detail="Environment validation, auth, role guards, driver onboarding, and admin approval endpoints are in place."
              />
              <StatusPanel
                label="Frontend"
                value="Shell ready"
                detail="Router, shared API client, Redux, Query, and role-aware surfaces are wired for the next slices."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Next tracked modules</p>
            <div className="mt-5 space-y-4">
              {[
                "Booking creation and dispatch queue",
                "Driver assignment accept or reject loop",
                "Trip lifecycle and cash payment confirmation",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 border-b border-white/8 pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-zinc-300">{item}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    planned
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Empty state</p>
          <h3 className="mt-4 text-2xl tracking-tight text-white">No live metrics yet</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Analytics surfaces stay intentionally quiet until booking, trip, and commission records exist. This keeps
            the dashboard aligned with the source-of-truth data model in the spec.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
