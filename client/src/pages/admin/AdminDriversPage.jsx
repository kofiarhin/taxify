import { useState } from "react";
import { AppShell } from "../../components/shared/AppShell";
import {
  useApproveDriverMutation,
  useDeactivateDriverMutation,
  useReactivateDriverMutation,
  useSuspendDriverMutation,
} from "../../hooks/mutations/useDriverMutations";
import { useAllDriversQuery, usePendingDriversQuery } from "../../hooks/queries/useDriverQueries";
import { DRIVER_STATUS_COLORS } from "../../constants/statuses";

const TABS = ["pending", "all"];
const SUSPENDABLE_STATUSES = new Set(["ACTIVE", "ASSIGNED", "BUSY", "ON_TRIP"]);

export function AdminDriversPage() {
  const [tab, setTab] = useState("pending");
  const [reasonMap, setReasonMap] = useState({});
  const pending = usePendingDriversQuery();
  const all = useAllDriversQuery();
  const approveMut = useApproveDriverMutation();
  const suspendMut = useSuspendDriverMutation();
  const reactivateMut = useReactivateDriverMutation();
  const deactivateMut = useDeactivateDriverMutation();

  const isLoading = tab === "pending" ? pending.isLoading : all.isLoading;
  const isError = tab === "pending" ? pending.isError : all.isError;
  const drivers = tab === "pending" ? pending.data ?? [] : all.data ?? [];

  function getReason(id) {
    return reasonMap[id] ?? "";
  }

  function setReason(id, value) {
    setReasonMap((previous) => ({ ...previous, [id]: value }));
  }

  return (
    <AppShell eyebrow="Admin workspace" title="Driver management.">
      <div className="mb-6 flex gap-2">
        {TABS.map((currentTab) => (
          <button
            key={currentTab}
            type="button"
            onClick={() => setTab(currentTab)}
            className={`rounded-full border px-4 py-2 text-sm capitalize transition duration-200 ${
              tab === currentTab
                ? "border-emerald-300/30 bg-emerald-300/10 text-white"
                : "border-white/10 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {currentTab === "pending"
              ? `Pending ${pending.data ? `(${pending.data.length})` : ""}`
              : "All drivers"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load drivers.
        </div>
      )}

      {!isLoading && !isError && drivers.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No drivers found in this view.
        </div>
      )}

      {!isLoading && !isError && drivers.length > 0 && (
        <div className="space-y-3">
          {drivers.map((driver) => {
            const profile = driver.driverProfile ?? driver;
            const status = profile.status ?? "UNKNOWN";
            const name = driver.fullName ?? profile.userId?.fullName ?? "--";
            const email = driver.email ?? profile.userId?.email ?? "--";
            const profileId = profile._id ?? driver._id;

            return (
              <div key={profileId} className="rounded-3xl border border-white/8 bg-white/3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base text-white">{name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{email}</p>
                    {profile.vehiclePlate && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {profile.vehicleMake} {profile.vehicleModel} | {profile.vehiclePlate}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                      DRIVER_STATUS_COLORS[status] ?? "text-zinc-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {status === "PENDING_APPROVAL" && (
                    <button
                      type="button"
                      disabled={approveMut.isPending}
                      onClick={() => approveMut.mutate(profileId)}
                      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}

                  {SUSPENDABLE_STATUSES.has(status) && (
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="Reason (optional)"
                        value={getReason(profileId)}
                        onChange={(event) => setReason(profileId, event.target.value)}
                        className="rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
                      />
                      <button
                        type="button"
                        disabled={suspendMut.isPending}
                        onClick={() => suspendMut.mutate({ id: profileId, reason: getReason(profileId) })}
                        className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 transition hover:-translate-y-px disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    </div>
                  )}

                  {status === "SUSPENDED" && (
                    <button
                      type="button"
                      disabled={reactivateMut.isPending}
                      onClick={() => reactivateMut.mutate(profileId)}
                      className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}

                  {status !== "DEACTIVATED" && status !== "PENDING_APPROVAL" && (
                    <button
                      type="button"
                      disabled={deactivateMut.isPending}
                      onClick={() => deactivateMut.mutate({ id: profileId, reason: getReason(profileId) })}
                      className="rounded-full border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-200 transition hover:-translate-y-px disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
