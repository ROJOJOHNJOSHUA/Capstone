/**
 * LoginModal — reusable modal login form.
 *
 * Props:
 *   isOpen   – controls visibility.
 *   onClose  – called when the user dismisses the modal (click-away or ×).
 *   from     – optional path the user was trying to reach before being
 *              intercepted by a route guard. After a successful login the
 *              modal tries to return them there — but only if their role
 *              actually permits that path. Otherwise falls back to their
 *              role's default dashboard.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardByRole, normalizeRole } from '../../utils/roleRedirect';
import { requestPasswordReset, resetPasswordWithOtp } from '../../services/api';

export default function LoginModal({ isOpen, onClose, from, onRegisterClick }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [view, setView] = useState('login');
  const [resetForm, setResetForm] = useState({ email: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setView('login');
    setError('');
    setSuccessMessage('');
    setResetForm({ email: '', phone: '' });
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const startForgot = () => {
    setResetForm({ email, phone: '' });
    setError('');
    setSuccessMessage('');
    setView('forgot');
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset({ email: resetForm.email.trim(), phone: resetForm.phone.trim() });
      setSuccessMessage('OTP sent via SMS. Enter the 6-digit code to continue.');
      setView('otp');
    } catch (sendError) {
      setError(sendError.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp({
        email: resetForm.email.trim(),
        phone: resetForm.phone.trim(),
        otp: otp.trim(),
        password: newPassword,
        confirm_password: confirmPassword,
      });
      setEmail(resetForm.email.trim());
      setPassword('');
      setSuccessMessage('Password updated successfully. Log in with your new password.');
      setView('login');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (resetError) {
      setError(resetError.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user?.role) throw new Error('Login failed: Invalid user data received.');

      const role = normalizeRole(user.role);
      const defaultDashboard = getDashboardByRole(role);

      // Return the user to the page they were trying to reach — only if their
      // role actually permits that path. A 'user'-role account must not be
      // sent to /admin/* even if that was the originally requested URL.
      const canReturn =
        from &&
        ((role === 'admin' && from.startsWith('/admin')) ||
          (role === 'user' && !from.startsWith('/admin')));

      onClose();
      navigate(canReturn ? from : defaultDashboard, { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetTitles = {
    forgot: 'Forgot password',
    otp: 'Enter OTP',
  };
  const resetSubtitles = {
    forgot: 'Enter your registered email and phone number. We will send a one-time PIN via SMS.',
    otp: `We sent a 6-digit OTP to ${resetForm.phone}. Enter it below with your new password.`,
  };
  const isResetView = view !== 'login';

  return createPortal(
    (
    <div
      data-login-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#14212b]/45 p-4 backdrop-blur-md"
      onClick={handleClose}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e8dfd0] bg-[#fffdf8] shadow-[0_30px_90px_rgba(15,31,45,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Header */}
        <div className="bg-[#14212b] px-6 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d7b57a]">
                Holy Family Parish
              </p>
              <h2 id="login-modal-title" className="mt-2 font-display text-2xl">
                {isResetView ? resetTitles[view] : 'Welcome back'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close login"
              className="mt-1 text-xl leading-none text-white/70 transition hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm text-blue-100/80">
            {isResetView ? resetSubtitles[view] : 'Sign in to manage your parish services.'}
          </p>
        </div>

        {view === 'login' && (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="modal-login-email"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
            >
              Email
            </label>
            <input
              id="modal-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="modal-login-password"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="modal-login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-12 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
                required
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
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={startForgot}
              className="text-xs font-semibold text-[#a6813f] transition hover:text-[#8b6b32]"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#b18a45] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#967338] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="text-center text-sm text-slate-600">
            No account?{' '}
            <button
              type="button"
              onClick={() => {
                handleClose();
                onRegisterClick?.();
              }}
              className="font-semibold text-[#a6813f] transition hover:text-[#8b6b32]"
            >
              Register
            </button>
          </p>
        </form>
        )}

        {view === 'forgot' && (
        <form onSubmit={handleSendOtp} className="space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="modal-reset-email" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Registered Email
            </label>
            <input
              id="modal-reset-email"
              type="email"
              value={resetForm.email}
              onChange={(event) => setResetForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="modal-reset-phone" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Registered Phone Number
            </label>
            <input
              id="modal-reset-phone"
              type="tel"
              value={resetForm.phone}
              onChange={(event) => setResetForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="09XX XXX XXXX"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#b18a45] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#967338] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending OTP…' : 'Send OTP via SMS'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Remembered your password?{' '}
            <button type="button" onClick={() => { setView('login'); setError(''); }} className="font-semibold text-[#a6813f] transition hover:text-[#8b6b32]">
              Back to login
            </button>
          </p>
        </form>
        )}

        {view === 'otp' && (
        <form onSubmit={handleResetPassword} className="space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="modal-reset-otp" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              6-Digit OTP
            </label>
            <input
              id="modal-reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-center text-lg font-semibold tracking-[0.5em] outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="modal-reset-new-password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              New Password
            </label>
            <input
              id="modal-reset-new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="modal-reset-confirm-password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Confirm New Password
            </label>
            <input
              id="modal-reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-xl bg-[#b18a45] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#967338] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating password…' : 'Reset Password'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }} className="font-semibold text-slate-500 transition hover:text-slate-700">
              ← Change email / phone
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSendOtp}
              className="font-semibold text-[#a6813f] transition hover:text-[#8b6b32] disabled:opacity-60"
            >
              Resend OTP
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
    ),
    document.body,
  );
}
