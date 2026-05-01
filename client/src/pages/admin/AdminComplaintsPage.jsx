import { useState } from "react";
import { AppShell } from "../../components/shared/AppShell";
import {
  useResolveComplaintMutation,
  useUpdateComplaintMutation,
} from "../../hooks/mutations/useComplaintMutations";
import { useComplaintsQuery } from "../../hooks/queries/useComplaintQueries";
import { COMPLAINT_STATUSES } from "../../constants/statuses";

const STATUS_COLORS = {
  OPEN: "text-amber-300",
  INVESTIGATING: "text-blue-300",
  RESOLVED: "text-emerald-300",
  DISMISSED: "text-zinc-500",
};

const PRIORITY_COLORS = {
  LOW: "text-zinc-400",
  MEDIUM: "text-amber-300",
  HIGH: "text-orange-300",
  CRITICAL: "text-red-300",
};

export function AdminComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [resolutionMap, setResolutionMap] = useState({});
  const { data, isLoading, isError } = useComplaintsQuery(statusFilter);
  const updateMut = useUpdateComplaintMutation();
  const resolveMut = useResolveComplaintMutation();
  const complaints = data?.complaints ?? [];

  return (
    <AppShell eyebrow="Admin workspace" title="Complaints.">
      <div className="mb-6 flex flex-wrap gap-2">
        {["", ...Object.values(COMPLAINT_STATUSES)].map((status) => (
          <button
            key={status || "all"}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
              statusFilter === status
                ? "border-emerald-300/30 bg-emerald-300/10 text-white"
                : "border-white/10 text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load complaints.
        </div>
      )}

      {!isLoading && !isError && complaints.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No complaints match this filter.
        </div>
      )}

      {!isLoading && !isError && complaints.length > 0 && (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase tracking-widest ${PRIORITY_COLORS[complaint.priority]}`}>
                      {complaint.priority}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-sm text-zinc-400">{complaint.category}</span>
                  </div>
                  <p className="mt-2 text-base text-white">{complaint.description}</p>
                  {complaint.customerName && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {complaint.customerName} {complaint.customerPhone && `| ${complaint.customerPhone}`}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-600">
                    Logged by {complaint.reportedByUserId?.fullName} | {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${STATUS_COLORS[complaint.status]}`}>
                  {complaint.status}
                </span>
              </div>

              {complaint.resolutionNotes && (
                <p className="mt-3 text-sm text-zinc-500">Resolution: {complaint.resolutionNotes}</p>
              )}

              {complaint.status !== "RESOLVED" && complaint.status !== "DISMISSED" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {complaint.status === "OPEN" && (
                    <button
                      type="button"
                      onClick={() => updateMut.mutate({ id: complaint._id, payload: { status: "INVESTIGATING" } })}
                      className="rounded-full border border-blue-300/20 bg-blue-300/10 px-4 py-2 text-sm text-blue-200 transition hover:-translate-y-px"
                    >
                      Investigate
                    </button>
                  )}
                  <input
                    placeholder="Resolution notes"
                    value={resolutionMap[complaint._id] ?? ""}
                    onChange={(event) =>
                      setResolutionMap((previous) => ({ ...previous, [complaint._id]: event.target.value }))
                    }
                    className="rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
                  />
                  <button
                    type="button"
                    disabled={resolveMut.isPending || !(resolutionMap[complaint._id]?.length >= 5)}
                    onClick={() => resolveMut.mutate({ id: complaint._id, notes: resolutionMap[complaint._id] })}
                    className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMut.mutate({ id: complaint._id, payload: { status: "DISMISSED" } })}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:-translate-y-px"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
