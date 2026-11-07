import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { changePassword, getMe, updateProfile } from '../services/api';
import { getPasswordValidationError } from '../utils/passwordValidation';

export default function Settings() {
  const { user, loadUser } = useAuth();
  const { language, setLanguage, t } = useSettings();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe()
      .then((res) => setEmail(res.data?.user?.email || user?.email || ''))
      .catch(() => setEmail(user?.email || ''))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const flash = (msg) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({ email: email.trim() });
      await loadUser();
      flash(t('settings.emailUpdated'));
    } catch (err) {
      setError(err.message || t('common.loading'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const passwordError = getPasswordValidationError(newPassword);
    if (passwordError) {
      setError(passwordError);
      setMessage('');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      setMessage('');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flash(t('settings.passwordUpdated'));
    } catch (err) {
      setError(err.message || t('common.loading'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contentClassName="xl:!p-5">
      <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4">
        <header className="mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f2337]">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('settings.subtitle')}</p>
        </header>

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#0f2337]">{t('settings.language')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('settings.languageDesc')}</p>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:min-w-[17rem] sm:grid-cols-2">
            {[
              { id: 'en', label: t('settings.english') },
              { id: 'tl', label: t('settings.tagalog') },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguage(opt.id)}
                aria-pressed={language === opt.id}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  language === opt.id
                    ? 'border-[#d7b57a] bg-[#f8f0df] text-[#0f2337]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#0f2337]">{t('settings.account')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('settings.accountDesc')}</p>
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-2 xl:gap-6">
            <form onSubmit={handleEmailSave} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{t('settings.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
                  required
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {t('settings.changeEmail')}
              </button>
            </form>

            <form onSubmit={handlePasswordSave} className="space-y-3 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <h3 className="text-sm font-semibold text-[#0f2337]">{t('settings.changePassword')}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{t('settings.currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{t('settings.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-slate-500">Use at least 8 characters, including letters and numbers.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{t('settings.confirmPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#d7b57a] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex items-end">
                  <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
                    {t('settings.changePassword')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
