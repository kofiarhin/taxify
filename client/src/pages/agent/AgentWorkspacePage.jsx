import { AppShell } from "../../components/shared/AppShell";
import { StatusPanel } from "../../components/shared/StatusPanel";

export function AgentWorkspacePage() {
  return (
    <AppShell
      eyebrow="Agent workspace"
      title="Dispatch surface."
      summary="This slice establishes the agent shell and route isolation. Booking intake, queue review, and driver assignment actions are the next build targets."
    >
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <StatusPanel
          label="Ready state"
          value="Shell staged"
          detail="The dispatch workspace is protected and role-scoped. Booking forms and queue data will bind here in the next milestone."
        />
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Empty queue state</p>
          <h3 className="mt-4 text-2xl tracking-tight text-white">No dispatch events loaded</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Queue, assignment retries, and booking intake remain pending until the booking domain is implemented.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
