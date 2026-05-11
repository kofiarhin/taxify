import { Car, ChartBar, ClipboardText, CurrencyDollar, Gauge, ListChecks, SignOut, UserCircle } from '@phosphor-icons/react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCredentials } from '../../redux/auth/authSlice';

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

export function AppShell() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];

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
