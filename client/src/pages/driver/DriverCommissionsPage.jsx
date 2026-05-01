import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { AppShell } from "../../components/shared/AppShell";
import { getMyCommissions, submitReceipt } from "../../services/commissionService";
import { COMMISSION_STATUS_COLORS } from "../../constants/statuses";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];

export function DriverCommissionsPage() {
  const qc = useQueryClient();
  const fileRefs = useRef({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["driver-commissions"],
    queryFn: () => getMyCommissions(),
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, file }) => submitReceipt(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-commissions"] }),
  });

  const statements = data?.statements ?? [];
  const totalOwed = statements.reduce((sum, s) => sum + (s.balanceDue ?? 0), 0);
  const apiBase = import.meta.env.VITE_API_URL?.replace("/api/v1", "") ?? "";

  return (
    <AppShell eyebrow="Driver workspace" title="Commission.">
      {totalOwed > 0 && (
        <div className="mb-6 rounded-3xl border border-amber-300/15 bg-amber-300/5 p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Total outstanding</p>
          <p className="mt-2 text-3xl text-amber-300">GHS {totalOwed.toFixed(2)}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Upload a payment receipt below to submit for admin review.
          </p>
        </div>
      )}

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
          No commission statements yet. They appear after you complete paid trips.
        </div>
      )}

      {!isLoading && !isError && statements.length > 0 && (
        <div className="space-y-4">
          {statements.map((s) => {
            const period = `${MONTHS[(s.periodMonth ?? 1) - 1]} ${s.periodYear}`;
            const canUpload = ["DUE", "OVERDUE", "REJECTED"].includes(s.status);

            return (
              <div key={s._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-base text-white">{period}</p>
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
                    <p className={s.balanceDue > 0 ? "text-red-300" : "text-emerald-300"}>
                      GHS {s.balanceDue?.toFixed(2)}
                    </p>
                  </div>
                </div>

                {s.receiptFileUrl && (
                  <a
                    href={`${apiBase}${s.receiptFileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-sm text-blue-300 underline"
                  >
                    View submitted receipt
                  </a>
                )}

                {s.reviewNotes && (
                  <p className="mt-2 text-sm text-zinc-500">Admin note: {s.reviewNotes}</p>
                )}

                {canUpload && (
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      ref={(el) => { fileRefs.current[s._id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMut.mutate({ id: s._id, file });
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadMut.isPending}
                      onClick={() => fileRefs.current[s._id]?.click()}
                      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-2.5 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      {uploadMut.isPending ? "Uploading..." : "Upload payment receipt"}
                    </button>
                  </div>
                )}

                {uploadMut.isError && uploadMut.variables?.id === s._id && (
                  <p className="mt-2 text-sm text-amber-300">
                    {uploadMut.error?.response?.data?.message ?? "Upload failed"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
