import { Link } from "react-router-dom";
import { ClockCountdown, MapPin, PlusCircle } from "@phosphor-icons/react";
import { DriverReviewPrompt } from "../../components/client/DriverReviewPrompt";
import { AppShell } from "../../components/shared/AppShell";
import { BOOKING_STATUS_LABELS } from "../../constants/statuses";
import { useClientCurrentBookingQuery } from "../../hooks/queries/useClientBookingQueries";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="max-w-[22rem] text-right text-sm text-zinc-200">{value || "-"}</p>
    </div>
  );
}

export function ClientDashboardPage() {
  const { data, isLoading, isError } = useClientCurrentBookingQuery();
  const booking = data?.booking;
  const review = data?.review;
  const driverName = booking?.assignedDriverId?.userId?.fullName;
  const driverVehicle = booking?.assignedDriverId
    ? `${booking.assignedDriverId.vehicleMake} ${booking.assignedDriverId.vehicleModel}`
    : "";

  return (
    <AppShell
      eyebrow="Client workspace"
      title="Your ride."
      summary="Request a trip, follow assignment progress, and confirm completion after the fare is shown."
    >
      {isLoading && <div className="h-56 animate-pulse rounded-3xl bg-white/6" />}

      {isError && (
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Could not load your current booking.
        </div>
      )}

      {!isLoading && !isError && !booking && (
        <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-7">
            <div className="mb-5 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-200">
              <PlusCircle size={24} weight="duotone" />
            </div>
            <p className="text-xl text-white">No active booking</p>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-zinc-400">
              Create a ride request and Taxify will assign an available driver or place it in the queue.
            </p>
            <Link
              to="/client/bookings/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:-translate-y-px active:scale-[0.98]"
            >
              <PlusCircle size={17} />
              New booking
            </Link>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/3 p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Status</p>
            <p className="mt-4 text-3xl tracking-tight text-white">Ready</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Current ride updates will appear here once a booking is active.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && booking && (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Current booking</p>
                  <p className="mt-2 text-2xl tracking-tight text-white">{booking.bookingReference}</p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-widest text-emerald-100">
                  {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </div>
              <div className="divide-y divide-white/8">
                <DetailRow label="Pickup" value={booking.pickupAddress} />
                <DetailRow label="Dropoff" value={booking.dropoffAddress} />
                <DetailRow label="Pickup time" value={new Date(booking.pickupTime).toLocaleString()} />
                <DetailRow label="Fare" value={booking.finalFare ? `GHS ${booking.finalFare.toFixed(2)}` : "Pending"} />
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
              <ClockCountdown size={24} className="text-emerald-300" weight="duotone" />
              <p className="mt-5 text-lg text-white">Track this ride</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Follow assignment, trip progress, fare, and completion confirmation from the tracker.
              </p>
              <Link
                to="/client/bookings/current"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-100 transition hover:-translate-y-px hover:border-emerald-300/30 active:scale-[0.98]"
              >
                <MapPin size={17} />
                Open tracker
              </Link>
            </div>
          </div>

          {(review?.eligible || review?.submitted) && (
            <DriverReviewPrompt
              bookingId={booking._id}
              driverName={driverName}
              driverVehicle={driverVehicle}
              review={review}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
