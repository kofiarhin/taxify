import { AgentBookingCreatePage } from './AgentBookingCreatePage';
import { AgentQueuePage } from './AgentQueuePage';

export function AgentWorkspacePage() {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Agent workspace</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">Walk-in rides and queue control</h2>
        <p className="mt-4 text-slate-600">Create offline bookings, retry queued rides, cancel pre-trip work, and log customer issues.</p>
      </div>
      <div className="space-y-6">
        <AgentBookingCreatePage />
        <AgentQueuePage />
      </div>
    </section>
  );
}
