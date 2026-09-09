import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import { requestPasswordReset, resetPasswordWithOtp } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({ email: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset({
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setSuccessMessage('An OTP has been sent to your registered phone number.');
      setStep('reset');
    } catch (requestError) {
      setError(requestError.message || 'Unable to send the OTP right now. Please try again.');
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

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your phone number.');
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithOtp({
        email: form.email.trim(),
        phone: form.phone.trim(),
        otp: otp.trim(),
        password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccessMessage('Password updated successfully. You can now log in with your new password.');
      setStep('success');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (resetError) {
      setError(resetError.message || 'Failed to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset({
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setSuccessMessage('A new OTP has been sent to your registered phone number.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to resend the OTP right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRequest = () => (
    <form onSubmit={handleRequestOtp} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Registered Email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleFieldChange}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Registered Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleFieldChange}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
          placeholder="09XX XXX XXXX"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#0f2337] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#18324c] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );

  const renderReset = () => (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          6-Digit OTP
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-center text-lg font-semibold tracking-[0.5em] text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
          placeholder="••••••"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-11 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '◉' : '◌'}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Confirm New Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
          minLength={8}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full rounded-xl bg-[#b18a45] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#967338] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Updating password...' : 'Reset Password'}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => {
            setError('');
            setSuccessMessage('');
            setStep('request');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          className="font-medium text-slate-500 transition hover:text-slate-700"
        >
          Change details
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleResendOtp}
          className="font-semibold text-[#a6813f] transition hover:text-[#8b6b32] disabled:opacity-60"
        >
          Resend OTP
        </button>
      </div>
    </form>
  );

  const renderSuccess = () => (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        ✓
      </div>
      <div>
        <h3 className="font-display text-2xl text-[#0f2337]">Password reset successful</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{successMessage}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/login', { replace: true })}
        className="w-full rounded-xl bg-[#0f2337] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#18324c]"
      >
        Return to Login
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ee]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#e8e0d3] bg-white shadow-[0_30px_80px_rgba(15,31,45,0.11)] ring-1 ring-[#f0e8dc]">
          <div className="grid md:grid-cols-[1.05fr_1.35fr]">
            <div className="relative overflow-hidden bg-[#0f2337] px-7 py-10 text-white md:px-10 md:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(215,181,122,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),transparent_24%)]" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d7b57a]">Holy Family Parish</p>
                <h1 className="mt-4 font-display text-3xl md:text-4xl font-bold leading-snug">
                  {step === 'success' ? 'Password updated' : 'Reset your password'}
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200">
                  {step === 'request'
                    ? 'Enter your registered email and phone number to receive a six-digit OTP.'
                    : step === 'reset'
                      ? 'Enter the OTP and create a new password for your parish account.'
                      : 'Your password has been updated successfully. Please sign in again.'}
                </p>

                <div className="mt-8 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7b57a] text-[#0f2337] font-bold text-xs">01</span>
                    <span>Verify your account</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7b57a] text-[#0f2337] font-bold text-xs">02</span>
                    <span>Enter the OTP</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d7b57a] text-[#0f2337] font-bold text-xs">03</span>
                    <span>Set a new password</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-8 sm:px-8 md:px-10 md:py-10">
              <div className="mb-6 text-center md:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7b57a]">Account Recovery</p>
                <h2 className="mt-2 font-display text-2xl text-[#0f2337]">
                  {step === 'request' ? 'Forgot Password' : step === 'reset' ? 'Verify OTP' : 'Success'}
                </h2>
              </div>

              {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
              {successMessage && step !== 'success' && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                  {successMessage}
                </div>
              )}

              {step === 'request' && renderRequest()}
              {step === 'reset' && renderReset()}
              {step === 'success' && renderSuccess()}

              {step !== 'success' && (
                <p className="mt-5 text-center text-sm text-slate-600">
                  Remembered your password?{' '}
                  <Link to="/login" className="font-semibold text-[#0f2337] transition hover:text-[#1d3d5c]">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
