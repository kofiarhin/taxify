import { useState } from "react";
import { AppShell } from "../../components/shared/AppShell";
import { useCancelBookingMutation } from "../../hooks/mutations/useBookingMutations";
import { useBookingsQuery } from "../../hooks/queries/useBookingQueries";
import { BOOKING_STATUS_COLORS, BOOKING_STATUSES } from "../../constants/statuses";

const STATUS_FILTERS = ["", ...Object.values(BOOKING_STATUSES)];

function fmt(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString();
}

export function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, isError } = useBookingsQuery(statusFilter);
  const cancelMut = useCancelBookingMutation();
  const bookings = data?.bookings ?? [];

  return (
    <AppShell eyebrow="Admin workspace" title="Bookings.">
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status || "all"}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition duration-200 ${
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
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load bookings.
        </div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
          No bookings match this filter.
        </div>
      )}

      {!isLoading && !isError && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-300">{booking.bookingReference}</p>
                  <p className="mt-1 text-base text-white">{booking.customerName}</p>
                  <p className="mt-1 text-sm text-zinc-500">{booking.customerPhone}</p>
                </div>
                <span
                  className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
                    BOOKING_STATUS_COLORS[booking.status] ?? "text-zinc-400"
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-zinc-400">
                <p>Pickup: {booking.pickupAddress}</p>
                <p>Dropoff: {booking.dropoffAddress}</p>
                <p>Pickup time: {fmt(booking.pickupTime)}</p>
                {booking.finalFare != null && (
                  <p className="text-emerald-300">Fare: GHS {booking.finalFare.toFixed(2)}</p>
                )}
              </div>

              {!["PAID", "CANCELLED", "COMPLETED"].includes(booking.status) && (
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={cancelMut.isPending}
                    onClick={() => cancelMut.mutate(booking._id)}
                    className="rounded-full border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm text-red-200 transition hover:-translate-y-px disabled:opacity-50"
                  >
                    Cancel booking
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
