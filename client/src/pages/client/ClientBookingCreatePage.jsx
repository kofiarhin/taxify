import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AppShell } from "../../components/shared/AppShell";
import { useCreateClientBookingMutation } from "../../hooks/mutations/useClientBookingMutations";

function Field({ label, error, helper, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-zinc-300">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-amber-300">{error}</span>
      ) : (
        <span className="text-sm text-zinc-600">{helper}</span>
      )}
    </label>
  );
}

export function ClientBookingCreatePage() {
  const navigate = useNavigate();
  const createMut = useCreateClientBookingMutation({
    onSuccess: () => navigate("/client/bookings/current"),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      pickupAddress: "",
      dropoffAddress: "",
      pickupTime: "",
      specialInstructions: "",
    },
  });

  function onSubmit(values) {
    createMut.mutate(values);
  }

  return (
    <AppShell
      eyebrow="Client booking"
      title="Request a ride."
      summary="Add the trip details. Dispatch will assign an active driver or queue the request."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 rounded-3xl border border-white/8 bg-white/3 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Pickup address" error={errors.pickupAddress?.message} helper="Include a landmark when useful.">
            <input
              {...register("pickupAddress", { required: "Pickup address is required", minLength: { value: 5, message: "Enter a more specific pickup address" } })}
              className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300/40"
            />
          </Field>
          <Field label="Dropoff address" error={errors.dropoffAddress?.message} helper="Use the final destination.">
            <input
              {...register("dropoffAddress", { required: "Dropoff address is required", minLength: { value: 5, message: "Enter a more specific dropoff address" } })}
              className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300/40"
            />
          </Field>
        </div>

        <Field label="Pickup time" error={errors.pickupTime?.message} helper="Choose when the driver should arrive.">
          <input
            type="datetime-local"
            {...register("pickupTime", { required: "Pickup time is required" })}
            className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300/40"
          />
        </Field>

        <Field label="Special instructions" error={errors.specialInstructions?.message} helper="Optional notes for the driver.">
          <textarea
            rows={4}
            {...register("specialInstructions", { maxLength: { value: 500, message: "Keep instructions under 500 characters" } })}
            className="resize-none rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300/40"
          />
        </Field>

        {createMut.isError && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
            {createMut.error?.message ?? "Could not create booking"}
          </div>
        )}

        <button
          type="submit"
          disabled={createMut.isPending}
          className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createMut.isPending ? "Creating booking..." : "Create booking"}
        </button>
      </form>
    </AppShell>
  );
}
