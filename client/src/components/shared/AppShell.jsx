import { Car, ChartBar, ClipboardText, CurrencyDollar, Gauge, ListChecks, SignOut, UserCircle } from '@phosphor-icons/react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCredentials } from '../../redux/auth/authSlice';
import { useSocket } from '../../realtime/socketContext';

const navByRole = {
  ADMIN: [
    ['Dashboard', '/admin', ChartBar],
    ['Drivers', '/admin/drivers', UserCircle],
    ['Bookings', '/admin/bookings', ClipboardText],
    ['Commissions', '/admin/commissions', CurrencyDollar],
    ['Complaints', '/admin/complaints', ListChecks]
  ],
  AGENT: [
    ['Workspace', '/agent', Gauge],
    ['Queue', '/agent/queue', ClipboardText],
    ['Complaints', '/agent/complaints', ListChecks]
  ],
  DRIVER: [
    ['Workspace', '/driver', Car],
    ['Commissions', '/driver/commissions', CurrencyDollar]
  ],
  CLIENT: [
    ['Dashboard', '/client', Gauge],
    ['Book ride', '/client/book', Car],
    ['Current ride', '/client/current', ClipboardText]
  ]
};

const realtimeState = {
  connected: {
    label: 'Realtime connected',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500'
  },
  reconnecting: {
    label: 'Realtime reconnecting',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500'
  },
  offline: {
    label: 'Realtime offline',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400'
  }
};

export function AppShell() {
  const { user } = useSelector((state) => state.auth);
  const { status } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];
  const currentRealtime = realtimeState[status] || realtimeState.offline;

  const logout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Taxify Dispatch</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">{user?.role?.toLowerCase()} console</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${currentRealtime.className}`}
              aria-label={currentRealtime.label}
              role="status"
            >
              <span className={`h-2 w-2 rounded-full ${currentRealtime.dotClassName}`} aria-hidden="true" />
              <span>{currentRealtime.label}</span>
            </div>
            {links.map(([label, to, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to.split('/').length === 2}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={17} weight="bold" />
                {label}
              </NavLink>
            ))}
            <button className="button-secondary" type="button" onClick={logout}>
              <SignOut size={17} weight="bold" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
