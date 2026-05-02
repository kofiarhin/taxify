import { CheckCircle, ClockCountdown, MapPin, SteeringWheel } from "@phosphor-icons/react";
import { DriverReviewPrompt } from "../../components/client/DriverReviewPrompt";
import { AppShell } from "../../components/shared/AppShell";
import { BOOKING_STATUS_LABELS } from "../../constants/statuses";
import { useConfirmClientCompleteMutation } from "../../hooks/mutations/useClientBookingMutations";
import { useClientCurrentBookingQuery } from "../../hooks/queries/useClientBookingQueries";

const steps = [
  "PENDING_ASSIGNMENT",
  "DRIVER_ASSIGNED",
  "DRIVER_ACCEPTED",
  "TRIP_IN_PROGRESS",
  "AWAITING_CLIENT_CONFIRMATION",
  "AWAITING_DRIVER_PAYMENT_CONFIRMATION",
  "COMPLETED",
];

const legacyStepMap = {
  ASSIGNED: "DRIVER_ASSIGNED",
  ACCEPTED: "DRIVER_ACCEPTED",
  IN_PROGRESS: "TRIP_IN_PROGRESS",
  PAYMENT_PENDING: "AWAITING_CLIENT_CONFIRMATION",
  TRIP_ENDED: "AWAITING_CLIENT_CONFIRMATION",
  PAID: "COMPLETED",
};

function normalizeStatus(status) {
  return legacyStepMap[status] ?? status;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-3 last:border-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="max-w-[22rem] text-right text-sm text-zinc-200">{value || "-"}</p>
    </div>
  );
}

export function ClientCurrentBookingPage() {
  const { data, isLoading, isError } = useClientCurrentBookingQuery();
  const confirmMut = useConfirmClientCompleteMutation();
  const booking = data?.booking;
  const trip = data?.trip;
  const review = data?.review;
  const normalizedStatus = normalizeStatus(booking?.status);
  const currentIndex = Math.max(0, steps.indexOf(normalizedStatus));
  const canConfirm = ["AWAITING_CLIENT_CONFIRMATION", "TRIP_ENDED", "PAYMENT_PENDING"].includes(booking?.status);
  const driverName = booking?.assignedDriverId?.userId?.fullName;
  const driverVehicle = booking?.assignedDriverId
    ? `${booking.assignedDriverId.vehicleMake} ${booking.assignedDriverId.vehicleModel}`
    : "";

  return (
    <AppShell eyebrow="Client tracker" title="Current booking.">
      {isLoading && <div className="h-64 animate-pulse rounded-3xl bg-white/6" />}

      {isError && (
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
          Could not load your current booking.
        </div>
      )}

      {!isLoading && !isError && !booking && (
        <div className="rounded-3xl border border-white/8 bg-white/3 p-8 text-center">
          <MapPin size={28} className="mx-auto text-zinc-500" />
          <p className="mt-4 text-xl text-white">No active ride</p>
          <p className="mt-2 text-sm text-zinc-500">Create a booking to start tracking a driver.</p>
        </div>
      )}

      {!isLoading && !isError && booking && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{booking.bookingReference}</p>
                <p className="mt-2 text-2xl tracking-tight text-white">
                  {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                </p>
              </div>
              <ClockCountdown size={24} className="text-emerald-300" weight="duotone" />
            </div>
            <div className="grid gap-3 md:grid-cols-7">
              {steps.map((step, index) => {
                const active = index <= currentIndex;
                return (
                  <div key={step} className="min-w-0">
                    <div className={`h-1 rounded-full ${active ? "bg-emerald-300" : "bg-white/10"}`} />
                    <p className={`mt-2 text-xs leading-snug ${active ? "text-zinc-100" : "text-zinc-600"}`}>
                      {BOOKING_STATUS_LABELS[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-zinc-500">Trip details</p>
              <div className="divide-y divide-white/8">
                <DetailRow label="Pickup" value={booking.pickupAddress} />
                <DetailRow label="Dropoff" value={booking.dropoffAddress} />
                <DetailRow label="Pickup time" value={new Date(booking.pickupTime).toLocaleString()} />
                <DetailRow label="Instructions" value={booking.specialInstructions} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
              <SteeringWheel size={24} className="text-emerald-300" weight="duotone" />
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-zinc-500">Driver</p>
              {booking.assignedDriverId ? (
                <div className="mt-4 space-y-2">
                  <p className="text-lg text-white">{booking.assignedDriverId.userId?.fullName ?? "Assigned driver"}</p>
                  <p className="text-sm text-zinc-400">
                    {booking.assignedDriverId.vehicleMake} {booking.assignedDriverId.vehicleModel}
                  </p>
                  <p className="font-mono text-sm text-zinc-500">{booking.assignedDriverId.vehiclePlate}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">A driver has not been assigned yet.</p>
              )}
            </div>
          </div>

          {(trip || booking.finalFare != null) && (
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
              <p className="mb-4 text-xs uppercase tracking-[0.24em] text-zinc-500">Fare</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-600">Duration</p>
                  <p className="mt-1 text-xl text-white">{trip?.durationMinutes ?? "-"} min</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-600">Distance</p>
                  <p className="mt-1 text-xl text-white">{trip?.distanceKm ?? "-"} km</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-4">
                  <p className="text-xs text-zinc-600">Final fare</p>
                  <p className="mt-1 text-xl text-emerald-300">
                    GHS {trip?.fare?.toFixed(2) ?? booking.finalFare?.toFixed(2) ?? "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {canConfirm && (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/8 p-6">
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="mt-1 text-emerald-300" weight="duotone" />
                <div className="flex-1">
                  <p className="text-lg text-white">Confirm trip completion</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Confirm after the trip has ended and the shown fare matches what you expect.
                  </p>
                  <button
                    type="button"
                    disabled={confirmMut.isPending}
                    onClick={() => confirmMut.mutate(booking._id)}
                    className="mt-5 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:-translate-y-px active:scale-[0.98] disabled:opacity-60"
                  >
                    {confirmMut.isPending ? "Confirming..." : "Confirm complete"}
                  </button>
                  {confirmMut.isError && (
                    <p className="mt-3 text-sm text-amber-300">{confirmMut.error?.message ?? "Could not confirm completion"}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
