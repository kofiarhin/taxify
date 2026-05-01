import { ShieldCheck, SteeringWheel, WaveTriangle } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { authFailed, authRequestStarted, authResolved } from "../../redux/auth/authSlice";
import { login } from "../../services/authService";

const quickAccounts = [
  { role: "Admin", email: "admin@taxify.local", lane: "Control room access" },
  { role: "Agent", email: "agent@taxify.local", lane: "Dispatch desk access" },
  { role: "Driver", email: "driver@taxify.local", lane: "Driver mobile access" },
];

export function LoginPage() {
  const dispatch = useDispatch();
  const { status, user, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "admin@taxify.local",
      password: "TaxifyPass123",
    },
  });

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === "AGENT") {
    return <Navigate to="/agent" replace />;
  }

  if (user?.role === "DRIVER") {
    return <Navigate to="/driver" replace />;
  }

  async function onSubmit(values) {
    dispatch(authRequestStarted());

    try {
      const data = await login(values);
      window.localStorage.setItem("taxify_token", data.token);
      dispatch(authResolved(data));
    } catch (submitError) {
      dispatch(authFailed(submitError.message));
    }
  }

  return (
    <div className="min-h-[100dvh] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1400px] grid-cols-1 overflow-hidden rounded-[2.8rem] border border-white/10 bg-zinc-950/70 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-sm md:grid-cols-[1.2fr_0.9fr]">
        <section className="relative flex min-h-[320px] flex-col justify-between border-b border-white/8 p-6 md:min-h-[100dvh] md:border-b-0 md:border-r md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(245,158,11,0.12),transparent_24%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Taxi dispatch platform</p>
            <h1 className="mt-4 max-w-[10ch] text-5xl tracking-tighter text-white md:text-6xl">
              Move bookings with less drag.
            </h1>
            <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-zinc-400">
              Taxify gives the control room a single operating surface for booking intake, driver readiness,
              queue management, and cash-trip closure.
            </p>
          </div>

          <div className="relative grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3 text-zinc-200">
                <ShieldCheck size={18} weight="duotone" />
                <span className="text-sm">Access lanes</span>
              </div>
              <div className="mt-5 space-y-3">
                {quickAccounts.map((account) => (
                  <div key={account.email} className="rounded-[1.4rem] border border-white/8 bg-zinc-900/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-500">{account.role}</p>
                        <p className="mt-1 text-base text-white">{account.email}</p>
                      </div>
                      <WaveTriangle size={18} className="text-emerald-300/80" />
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">{account.lane}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">What this slice includes</p>
              <ul className="mt-5 space-y-4 text-sm text-zinc-300">
                <li className="border-l border-emerald-300/30 pl-4">Backend env validation and auth shell</li>
                <li className="border-l border-emerald-300/30 pl-4">Role-aware frontend routing and providers</li>
                <li className="border-l border-emerald-300/30 pl-4">Driver onboarding and admin approval API foundation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 md:p-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] md:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-200">
                <SteeringWheel size={22} weight="duotone" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Secure access</p>
                <h2 className="mt-1 text-2xl tracking-tight text-white">Sign in to Taxify</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Email</span>
                <input
                  {...register("email", { required: "Email is required" })}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-zinc-600 focus:border-emerald-300/40"
                  placeholder="ops@taxify.io"
                />
                {errors.email ? <span className="text-sm text-amber-300">{errors.email.message}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-300">Password</span>
                <input
                  type="password"
                  {...register("password", { required: "Password is required" })}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none transition duration-300 placeholder:text-zinc-600 focus:border-emerald-300/40"
                  placeholder="Minimum 8 characters"
                />
                {errors.password ? (
                  <span className="text-sm text-amber-300">{errors.password.message}</span>
                ) : (
                  <span className="text-sm text-zinc-500">Use a seeded account from your local environment.</span>
                )}
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/14 px-5 py-3 text-sm font-medium text-emerald-100 transition duration-300 hover:-translate-y-[1px] hover:border-emerald-300/40 hover:bg-emerald-300/18 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Verifying access..." : "Enter control room"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
