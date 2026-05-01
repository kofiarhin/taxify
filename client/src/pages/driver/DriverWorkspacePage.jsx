import { AppShell } from "../../components/shared/AppShell";
import { StatusPanel } from "../../components/shared/StatusPanel";

export function DriverWorkspacePage() {
  return (
    <AppShell
      eyebrow="Driver workspace"
      title="Driver lane."
      summary="The mobile-friendly driver shell is in place with protected access. Assignment polling, trip actions, and commission statements will connect here once the backend domains land."
    >
      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current assignment</p>
          <h3 className="mt-4 text-2xl tracking-tight text-white">Waiting for dispatch binding</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            This screen is intentionally prepared for large touch targets, concise trip state, and payment confirmation
            controls required by the spec.
          </p>
        </div>
        <StatusPanel
          label="Profile state"
          value="Protected"
          detail="Driver-specific `/drivers/me` routing is available and tied to role-based access control."
        />
      </div>
    </AppShell>
  );
}
