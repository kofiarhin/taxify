import { useState } from 'react';
import { Car } from '@phosphor-icons/react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../redux/auth/authSlice';
import { authService } from '../../services/authService';
import { apiErrorMessage } from '../../lib/api';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.login(form);
      dispatch(setCredentials(data));
      navigate(`/${data.user.role.toLowerCase()}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] grid-cols-1 bg-slate-50 md:grid-cols-[1.2fr_0.8fr]">
      <section className="flex items-center px-4 py-10 md:px-12">
        <div className="max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-md border border-teal-700/20 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">
            <Car size={18} weight="bold" />
            Taxify Dispatch
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Live taxi operations, without the clipboard.</h1>
          <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-slate-600">
            Book rides, assign drivers, track cash completion, and review trip quality from one role-aware workspace.
          </p>
        </div>
      </section>
      <section className="flex items-center px-4 pb-10 md:px-10 md:py-10">
        <form className="panel w-full space-y-5 p-6" onSubmit={submit}>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-slate-600">Use an admin, agent, driver, or client account.</p>
          </div>
          <label className="field">
            <span className="field-label">Email</span>
            <input className="field-input" name="email" type="email" value={form.email} onChange={update} required />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input className="field-input" name="password" type="password" value={form.password} onChange={update} required />
          </label>
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{error}</p> : null}
          <button className="button-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in' : 'Sign in'}
          </button>
          <p className="text-sm text-slate-600">
            New client or driver?{' '}
            <Link className="font-semibold text-teal-800" to="/register">
              Create an account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
