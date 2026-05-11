import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../redux/auth/authSlice';
import { apiErrorMessage } from '../../lib/api';
import { authService } from '../../services/authService';

export function RegisterClientPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CLIENT' });
  const [error, setError] = useState('');

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await authService.register(form);
      dispatch(setCredentials(data));
      navigate(`/${data.user.role.toLowerCase()}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-10">
      <form className="panel w-full max-w-xl space-y-5 p-6" onSubmit={submit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Taxify access</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Create your account</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="field-input" name="name" value={form.name} onChange={update} required />
          </label>
          <label className="field">
            <span className="field-label">Phone</span>
            <input className="field-input" name="phone" value={form.phone} onChange={update} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Email</span>
          <input className="field-input" name="email" type="email" value={form.email} onChange={update} required />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="field-input" name="password" type="password" value={form.password} onChange={update} required />
          <span className="text-xs text-slate-500">Use at least 8 characters.</span>
        </label>
        <label className="field">
          <span className="field-label">Account type</span>
          <select className="field-input" name="role" value={form.role} onChange={update}>
            <option value="CLIENT">Client</option>
            <option value="DRIVER">Driver</option>
          </select>
        </label>
        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{error}</p> : null}
        <button className="button-primary w-full" type="submit">
          Register
        </button>
        <Link className="block text-sm font-semibold text-teal-800" to="/login">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
