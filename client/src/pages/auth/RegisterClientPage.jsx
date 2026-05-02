import { SteeringWheel } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { authFailed, authRequestStarted, authResolved } from "../../redux/auth/authSlice";
import { registerClient } from "../../services/authService";

export function RegisterClientPage() {
  const dispatch = useDispatch();
  const { status, user, error } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  });

  if (user?.role === "CLIENT") return <Navigate to="/client" replace />;

  async function onSubmit(values) {
    dispatch(authRequestStarted());
    try {
      const data = await registerClient(values);
      window.localStorage.setItem("taxify_token", data.token);
      dispatch(authResolved(data));
    } catch (submitError) {
      dispatch(authFailed(submitError.message));
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-xl rounded-[2.4rem] border border-white/10 bg-zinc-950/75 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-200">
            <SteeringWheel size={22} weight="duotone" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Client access</p>
            <h1 className="mt-1 text-2xl tracking-tight text-white">Create your Taxify account</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Full name</span>
            <input {...register("fullName", { required: "Full name is required" })} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-300/40" />
            {errors.fullName && <span className="text-sm text-amber-300">{errors.fullName.message}</span>}
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Email</span>
            <input {...register("email", { required: "Email is required" })} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-300/40" />
            {errors.email && <span className="text-sm text-amber-300">{errors.email.message}</span>}
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Phone</span>
            <input {...register("phone", { required: "Phone is required" })} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-300/40" />
            {errors.phone && <span className="text-sm text-amber-300">{errors.phone.message}</span>}
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Password</span>
            <input type="password" {...register("password", { required: "Password is required", minLength: { value: 8, message: "Use at least 8 characters" } })} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-300/40" />
            {errors.password ? <span className="text-sm text-amber-300">{errors.password.message}</span> : <span className="text-sm text-zinc-600">Minimum 8 characters.</span>}
          </label>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

        <button type="submit" disabled={status === "loading"} className="mt-7 w-full rounded-full border border-emerald-300/25 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-100 transition hover:-translate-y-px active:scale-[0.98] disabled:opacity-60">
          {status === "loading" ? "Creating account..." : "Create client account"}
        </button>
        <Link to="/login" className="mt-4 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          Sign in instead
        </Link>
      </form>
    </div>
  );
}
