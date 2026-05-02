import { Link } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import { useAgentBookingsQuery } from "../../hooks/queries/useBookingQueries";
import { BOOKING_STATUS_COLORS } from "../../constants/statuses";

const activeStatuses = new Set([
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "DRIVER_ASSIGNED",
  "ACCEPTED",
  "DRIVER_ACCEPTED",
  "IN_PROGRESS",
  "TRIP_IN_PROGRESS",
  "TRIP_ENDED",
  "AWAITING_CLIENT_CONFIRMATION",
  "PAYMENT_PENDING",
  "AWAITING_DRIVER_PAYMENT_CONFIRMATION",
]);

const recentStatuses = new Set(["PAID", "COMPLETED", "CANCELLED", "QUEUED"]);

export function AgentWorkspacePage() {
  const { data, isLoading, isError } = useAgentBookingsQuery();
  const bookings = data?.bookings ?? [];
  const active = bookings.filter((booking) => activeStatuses.has(booking.status));
  const recent = bookings.filter((booking) => recentStatuses.has(booking.status));

  return (
    <AppShell eyebrow="Agent workspace" title="Dispatch board.">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {active.length} active | {bookings.filter((booking) => booking.status === "QUEUED").length} queued
        </p>
        <Link
          to="/agent/bookings/new"
          className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100 transition hover:-translate-y-px"
        >
          + New booking
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-3xl bg-white/6" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Failed to load bookings.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Active</p>
              <div className="space-y-3">
                {active.map((booking) => (
                  <BookingRow key={booking._id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Recent</p>
              <div className="space-y-3">
                {recent.map((booking) => (
                  <BookingRow key={booking._id} booking={booking} />
                ))}
              </div>
            </section>
          )}

          {bookings.length === 0 && (
            <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
              No bookings yet. Create the first one.
            </div>
          )}

          {bookings.length > 0 && active.length === 0 && recent.length === 0 && (
            <div className="rounded-4xl border border-white/8 bg-white/3 p-6 text-zinc-400">
              No displayable bookings match the current board groups.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function BookingRow({ booking }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-zinc-400">{booking.bookingReference}</p>
          <p className="mt-1 text-base text-white">{booking.customerName}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {booking.pickupAddress} {"->"} {booking.dropoffAddress}
          </p>
        </div>
        <span
          className={`rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest ${
            BOOKING_STATUS_COLORS[booking.status] ?? "text-zinc-400"
          }`}
        >
          {booking.status}
        </span>
      </div>
    </div>
  );
}
