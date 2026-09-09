/**
 * RegisterModal — centered modal registration form matching LoginModal's UI.
 *
 * Props:
 *   isOpen        – controls visibility.
 *   onClose       – called when the user dismisses the modal (click-away or ×).
 *   onRegistered  – called after a successful registration.
 *   onLoginClick  – called when the user picks "Login" inside the modal, so the
 *                   parent can swap to the login modal without a page change.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterModal({ isOpen, onClose, onRegistered, onLoginClick }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setForm({ fullname: '', email: '', phone: '', address: '', password: '', confirm: '' });
    setError('');
    setFieldErrors({});
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const normalizedEmail = form.email.trim();
    if (!/^[^@\s]+@gmail\.com$/i.test(normalizedEmail)) {
      setFieldErrors({ email: 'Please use a valid Gmail address ending in @gmail.com.' });
      return;
    }
    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await register({
        fullname: form.fullname.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
        confirm_password: form.confirm,
      });
      resetForm();
      onRegistered?.();
      onClose();
    } catch (registerError) {
      setError(registerError.message || 'Registration failed.');
      if (registerError.errors) setFieldErrors(registerError.errors);
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', required = true, span = false) => (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label
        htmlFor={`modal-register-${name}`}
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
      >
        {label}
      </label>
      <input
        id={`modal-register-${name}`}
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        required={required}
        className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20 ${
          fieldErrors[name] ? 'border-red-400 bg-red-50' : 'border-slate-200'
        }`}
      />
      {fieldErrors[name] && <p className="mt-1 text-xs text-red-600">{fieldErrors[name]}</p>}
    </div>
  );

  return createPortal(
    <div
      data-register-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#14212b]/45 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <section
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#e8dfd0] bg-[#fffdf8] shadow-[0_30px_90px_rgba(15,31,45,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
      >
        {/* Header */}
        <div className="bg-[#14212b] px-6 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d7b57a]">
                Holy Family Parish
              </p>
              <h2 id="register-modal-title" className="mt-2 font-display text-2xl">
                Create your account
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close registration"
              className="mt-1 text-xl leading-none text-white/70 transition hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm text-blue-100/80">
            Register as a parishioner to request parish services.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {field('fullname', 'Full Name', 'text', true, true)}
            {field('email', 'Email', 'email', true, true)}
            {field('phone', 'Phone', 'tel')}
            {field('address', 'Address', 'text', false)}
            <div>
              <label
                htmlFor="modal-register-password"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="modal-register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 pr-12 text-sm outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20 ${
                    fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>
            {field('confirm', 'Confirm Password', showPassword ? 'text' : 'password')}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#b18a45] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#967338] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onLoginClick?.();
              }}
              className="font-semibold text-[#a6813f] transition hover:text-[#8b6b32]"
            >
              Login
            </button>
          </p>
        </form>
      </section>
    </div>,
    document.body,
  );
}
