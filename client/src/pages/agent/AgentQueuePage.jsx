import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "../../components/shared/AppShell";
import { getQueue, retryAssignment } from "../../services/bookingService";

function minutesAgo(dateStr) {
  if (!dateStr) return "—";
  return Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export function AgentQueuePage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["queue"],
    queryFn: getQueue,
    refetchInterval: 10000,
  });

  const retryMut = useMutation({
    mutationFn: retryAssignment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });

  const bookings = data ?? [];

  return (
    <AppShell eyebrow="Agent workspace" title="Queue.">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} waiting for a driver
        </p>
        <p className="text-xs text-zinc-600">Auto-refreshes every 10s</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}
      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load queue.
        </div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          Queue is clear — no bookings waiting.
        </div>
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b._id} className="rounded-3xl border border-amber-300/10 bg-amber-300/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-400">{b.bookingReference}</p>
                  <p className="mt-1 text-base text-white">{b.customerName}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {b.pickupAddress} → {b.dropoffAddress}
                  </p>
                </div>
                <span className="text-xs text-amber-400">
                  {minutesAgo(b.queueEnteredAt)} min in queue
                </span>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  disabled={retryMut.isPending}
                  onClick={() => retryMut.mutate(b._id)}
                  className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                >
                  Retry dispatch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
