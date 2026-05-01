import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/shared/AppShell";
import { useCreateBookingMutation } from "../../hooks/mutations/useBookingMutations";

function Field({ label, error, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-zinc-300">{label}</span>
      {children}
      {error && <span className="text-sm text-amber-300">{error.message}</span>}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/40 ${className}`}
      {...props}
    />
  );
}

export function AgentBookingCreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      pickupTime: new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16),
    },
  });

  const mutation = useCreateBookingMutation({
    onSuccess: () => navigate("/agent"),
  });

  function onSubmit(values) {
    mutation.mutate({
      ...values,
      estimatedFare: values.estimatedFare ? parseFloat(values.estimatedFare) : null,
      pickupTime: new Date(values.pickupTime).toISOString(),
    });
  }

  return (
    <AppShell eyebrow="Agent workspace" title="New booking.">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
        <Field label="Customer name" error={errors.customerName}>
          <Input
            placeholder="Full name"
            {...register("customerName", { required: "Required" })}
          />
        </Field>

        <Field label="Customer phone" error={errors.customerPhone}>
          <Input
            placeholder="+233 ..."
            {...register("customerPhone", { required: "Required" })}
          />
        </Field>

        <Field label="Pickup address" error={errors.pickupAddress}>
          <Input
            placeholder="Street, area, landmark"
            {...register("pickupAddress", { required: "Required" })}
          />
        </Field>

        <Field label="Dropoff address" error={errors.dropoffAddress}>
          <Input
            placeholder="Destination address"
            {...register("dropoffAddress", { required: "Required" })}
          />
        </Field>

        <Field label="Pickup time" error={errors.pickupTime}>
          <Input
            type="datetime-local"
            {...register("pickupTime", { required: "Required" })}
          />
        </Field>

        <Field label="Estimated fare (GHS, optional)" error={errors.estimatedFare}>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("estimatedFare")}
          />
        </Field>

        <Field label="Special instructions" error={errors.specialInstructions}>
          <textarea
            placeholder="Any notes for the driver"
            rows={3}
            className="resize-none rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/40"
            {...register("specialInstructions")}
          />
        </Field>

        {mutation.isError && (
          <div className="rounded-4xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
            {mutation.error?.response?.data?.message ?? "Failed to create booking"}
          </div>
        )}

        {mutation.isSuccess && (
          <div className="rounded-4xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-200">
            Booking created and dispatched.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/14 px-6 py-3 text-sm text-emerald-100 transition hover:-translate-y-px disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create and dispatch"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/agent")}
            className="rounded-full border border-white/10 px-6 py-3 text-sm text-zinc-400 transition hover:text-zinc-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </AppShell>
  );
}
