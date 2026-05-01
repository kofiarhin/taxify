import { House, SignOut, SteeringWheel, UsersThree, WaveSquare } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { logoutSucceeded } from "../../redux/auth/authSlice";

const roleNavigation = {
  ADMIN: [
    { to: "/admin", label: "Overview", icon: House },
    { to: "/admin/users", label: "Team", icon: UsersThree },
  ],
  AGENT: [{ to: "/agent", label: "Dispatch", icon: WaveSquare }],
  DRIVER: [{ to: "/driver", label: "Drive", icon: SteeringWheel }],
};

export function AppShell({ eyebrow, title, summary, children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const items = roleNavigation[user?.role] || [];

  function handleLogout() {
    window.localStorage.removeItem("taxify_token");
    dispatch(logoutSucceeded());
  }

  return (
    <div className="min-h-[100dvh] bg-transparent px-4 py-4 text-zinc-100 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[2.5rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/70">Taxify</p>
            <h1 className="mt-3 text-3xl tracking-tight text-white">Operations grid</h1>
            <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-zinc-400">
              Control booking flow, driver readiness, and payment checkpoints from one surface.
            </p>
          </div>

          <nav className="space-y-2">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-[1.4rem] border px-4 py-3 text-sm transition duration-300 ${
                    isActive
                      ? "border-emerald-300/30 bg-emerald-300/10 text-white"
                      : "border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:text-zinc-100"
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} weight="duotone" />
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Signed in</p>
            <p className="mt-3 text-base text-white">{user?.fullName}</p>
            <p className="mt-1 text-sm text-zinc-400">{user?.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition duration-300 hover:-translate-y-[1px] hover:border-emerald-300/30 hover:bg-emerald-300/10 active:scale-[0.98]"
            >
              <SignOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8">
          <header className="grid gap-6 border-b border-white/8 pb-8 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">{eyebrow}</p>
              <h2 className="mt-3 max-w-[12ch] text-4xl tracking-tighter text-white md:text-5xl">{title}</h2>
              <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-zinc-400">{summary}</p>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-zinc-900/60 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Platform mode</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl tracking-tight text-white">{user?.role}</p>
                  <p className="mt-1 text-sm text-zinc-500">Authenticated session ready</p>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
              </div>
            </div>
          </header>

          <section className="pt-8">{children}</section>
        </main>
      </div>
    </div>
  );
}
