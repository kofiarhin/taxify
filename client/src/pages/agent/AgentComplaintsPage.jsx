import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppShell } from "../../components/shared/AppShell";
import { createComplaint, getComplaints } from "../../services/complaintService";
import { COMPLAINT_PRIORITIES } from "../../constants/statuses";

const STATUS_COLORS = {
  OPEN: "text-amber-300",
  INVESTIGATING: "text-blue-300",
  RESOLVED: "text-emerald-300",
  DISMISSED: "text-zinc-500",
};

export function AgentComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["agent-complaints"],
    queryFn: () => getComplaints(),
  });

  const createMut = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-complaints"] });
      setShowForm(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { priority: "MEDIUM" } });

  const complaints = data?.complaints ?? [];

  return (
    <AppShell eyebrow="Agent workspace" title="Complaints.">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{complaints.length} total</p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px"
        >
          {showForm ? "Cancel" : "+ Log complaint"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((v) => createMut.mutate(v))}
          className="mb-8 space-y-4 rounded-3xl border border-white/8 bg-white/3 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Category</span>
              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
                placeholder="e.g. Driver behaviour"
                {...register("category", { required: "Required" })}
              />
              {errors.category && <span className="text-sm text-amber-300">{errors.category.message}</span>}
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Priority</span>
              <select
                className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
                {...register("priority")}
              >
                {Object.values(COMPLAINT_PRIORITIES).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Description</span>
            <textarea
              rows={3}
              className="resize-none rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
              placeholder="Describe the issue"
              {...register("description", { required: "Required", minLength: { value: 10, message: "Min 10 characters" } })}
            />
            {errors.description && <span className="text-sm text-amber-300">{errors.description.message}</span>}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Customer name (optional)</span>
              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
                {...register("customerName")}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Customer phone (optional)</span>
              <input
                className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
                {...register("customerPhone")}
              />
            </label>
          </div>

          {createMut.isError && (
            <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">
              {createMut.error?.response?.data?.message ?? "Failed to log complaint"}
            </div>
          )}

          <button
            type="submit"
            disabled={createMut.isPending}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/14 px-6 py-2.5 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
          >
            {createMut.isPending ? "Logging..." : "Submit complaint"}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}
      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load complaints.
        </div>
      )}

      {!isLoading && !isError && complaints.length === 0 && !showForm && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No complaints logged yet.
        </div>
      )}

      {!isLoading && !isError && complaints.length > 0 && (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-3xl border border-white/8 bg-white/3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{c.priority}</span>
                    <span>·</span>
                    <span>{c.category}</span>
                    <span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-200">{c.description}</p>
                </div>
                <span className={`text-xs uppercase tracking-widest ${STATUS_COLORS[c.status] ?? "text-zinc-400"}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
