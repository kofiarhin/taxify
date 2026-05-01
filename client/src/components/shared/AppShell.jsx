import {
  ChartBar,
  ChatCenteredDots,
  ClockCountdown,
  CurrencyDollar,
  House,
  ListBullets,
  PlusCircle,
  SignOut,
  SteeringWheel,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { logoutSucceeded } from "../../redux/auth/authSlice";

const roleNavigation = {
  ADMIN: [
    { to: "/admin", label: "Overview", icon: House, end: true },
    { to: "/admin/drivers", label: "Drivers", icon: SteeringWheel },
    { to: "/admin/bookings", label: "Bookings", icon: ListBullets },
    { to: "/admin/queue", label: "Queue", icon: ClockCountdown },
    { to: "/admin/trips", label: "Trips", icon: ChartBar },
    { to: "/admin/commissions", label: "Commissions", icon: CurrencyDollar },
    { to: "/admin/complaints", label: "Complaints", icon: Warning },
    { to: "/admin/users", label: "Team", icon: UsersThree },
  ],
  AGENT: [
    { to: "/agent", label: "Dispatch", icon: House, end: true },
    { to: "/agent/bookings/new", label: "New Booking", icon: PlusCircle },
    { to: "/agent/queue", label: "Queue", icon: ClockCountdown },
    { to: "/agent/complaints", label: "Complaints", icon: ChatCenteredDots },
  ],
  DRIVER: [
    { to: "/driver", label: "Drive", icon: SteeringWheel, end: true },
    { to: "/driver/trips", label: "Trip History", icon: ListBullets },
    { to: "/driver/commissions", label: "Commission", icon: CurrencyDollar },
  ],
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
    <div className="min-h-dvh bg-transparent px-4 py-4 text-zinc-100 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-350 grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[2.5rem] border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/70">Taxify</p>
            <h1 className="mt-3 text-2xl tracking-tight text-white">Operations grid</h1>
          </div>

          <nav className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 text-sm transition duration-300 ${
                    isActive
                      ? "border-emerald-300/30 bg-emerald-300/10 text-white"
                      : "border-white/5 bg-white/3 text-zinc-400 hover:border-white/10 hover:text-zinc-100"
                  }`
                }
              >
                <Icon size={16} weight="duotone" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Signed in</p>
            <p className="mt-2 text-base text-white">{user?.fullName}</p>
            <p className="mt-1 text-sm text-zinc-400">{user?.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition duration-300 hover:-translate-y-px hover:border-emerald-300/30 hover:bg-emerald-300/10 active:scale-[0.98]"
            >
              <SignOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8">
          {(eyebrow || title) && (
            <header className="mb-8 border-b border-white/8 pb-6">
              {eyebrow && (
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">{eyebrow}</p>
              )}
              {title && (
                <h2 className="mt-2 text-3xl tracking-tighter text-white md:text-4xl">{title}</h2>
              )}
              {summary && (
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-zinc-400">{summary}</p>
              )}
            </header>
          )}
          <section>{children}</section>
        </main>
      </div>
    </div>
  );
}
