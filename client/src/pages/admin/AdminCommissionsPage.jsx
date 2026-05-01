import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "../../components/shared/AppShell";
import { approveCommission, getAllCommissions, rejectCommission } from "../../services/commissionService";
import { COMMISSION_STATUS_COLORS } from "../../constants/statuses";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

export function AdminCommissionsPage() {
  const [notesMap, setNotesMap] = useState({});
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["commissions-all"],
    queryFn: () => getAllCommissions(),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, notes }) => approveCommission(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commissions-all"] }),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, notes }) => rejectCommission(id, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commissions-all"] }),
  });

  const statements = data?.statements ?? [];
  const apiBase = import.meta.env.VITE_API_URL?.replace("/api/v1", "") ?? "";

  function getNotes(id) {
    return notesMap[id] ?? "";
  }
  function setNotes(id, val) {
    setNotesMap((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <AppShell eyebrow="Admin workspace" title="Commission review.">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}
      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load commission statements.
        </div>
      )}

      {!isLoading && !isError && statements.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No commission statements yet.
        </div>
      )}

      {!isLoading && !isError && statements.length > 0 && (
        <div className="space-y-4">
          {statements.map((s) => {
            const driverName = s.driverId?.userId?.fullName ?? "—";
            const driverEmail = s.driverId?.userId?.email ?? "";
            const period = `${MONTHS[(s.periodMonth ?? 1) - 1]} ${s.periodYear}`;

            return (
              <div key={s._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base text-white">{driverName}</p>
                    <p className="text-sm text-zinc-500">{driverEmail}</p>
                    <p className="mt-1 text-sm text-zinc-400">{period}</p>
                  </div>
                  <span
                    className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                      COMMISSION_STATUS_COLORS[s.status] ?? "text-zinc-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-600">Revenue</p>
                    <p className="text-zinc-300">GHS {s.grossTripRevenue?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Commission (10%)</p>
                    <p className="text-amber-300">GHS {s.commissionTotal?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Balance due</p>
                    <p className={s.balanceDue > 0 ? "text-red-300" : "text-zinc-400"}>
                      GHS {s.balanceDue?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {s.receiptFileUrl && (
                  <div className="mt-3">
                    <a
                      href={`${apiBase}${s.receiptFileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-300 underline"
                    >
                      View submitted receipt
                    </a>
                  </div>
                )}

                {s.reviewNotes && (
                  <p className="mt-2 text-sm text-zinc-500">Note: {s.reviewNotes}</p>
                )}

                {s.status === "SUBMITTED" && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      placeholder="Review notes (optional)"
                      value={getNotes(s._id)}
                      onChange={(e) => setNotes(s._id, e.target.value)}
                      className="rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      disabled={approveMut.isPending}
                      onClick={() => approveMut.mutate({ id: s._id, notes: getNotes(s._id) })}
                      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={rejectMut.isPending}
                      onClick={() => rejectMut.mutate({ id: s._id, notes: getNotes(s._id) })}
                      className="rounded-full border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-200 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
