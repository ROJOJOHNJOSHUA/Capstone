import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getMe, getProfilePicture, updateProfile, uploadProfilePicture } from '../services/api';

function ReadOnlyField({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[#e7dfd2] bg-[#f8f4ec] px-4 py-3.5 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="break-words text-sm font-semibold text-[#0f2337]">{value || '—'}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Profile() {
  const { user, loadUser, refreshProfilePicture } = useAuth();
  const { t } = useSettings();
  const [account, setAccount] = useState({
    email: '',
    role: '',
    created_at: '',
  });
  const [saved, setSaved] = useState({
    fullname: '',
    phone: '',
    address: '',
  });
  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [pendingProfilePicture, setPendingProfilePicture] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const profilePictureInput = useRef(null);

  useEffect(() => {
    getMe()
      .then((res) => {
        const u = res.data?.user || {};
        setAccount({
          email: u.email || '',
          role: u.role || '',
          created_at: u.created_at || '',
        });
        const profile = {
          fullname: u.fullname || '',
          phone: u.phone || '',
          address: u.address || '',
        };
        setSaved(profile);
        setForm(profile);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    getProfilePicture()
      .then((res) => {
        if (active) setProfilePicture(URL.createObjectURL(res.data));
      })
      .catch((err) => {
        if (err.status !== 404) {
          setMessage({ type: 'error', text: err.message || 'Could not load your profile picture.' });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (profilePicture) URL.revokeObjectURL(profilePicture);
  }, [profilePicture]);

  const memberSince = account.created_at
    ? new Date(account.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const profileInitials = (saved.fullname || user?.fullname || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Choose a JPG, PNG, or WebP image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Profile pictures must be smaller than 5 MB.' });
      return;
    }

    setMessage({ type: '', text: '' });
    setPendingProfilePicture(file);
    setProfilePicture(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});
    setSaving(true);
    let profileDetailsSaved = false;
    let profilePictureSaved = false;
    try {
      const payload = {
        fullname: form.fullname.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      await updateProfile(payload);
      profileDetailsSaved = true;
      setSaved(payload);
      setForm(payload);
      if (pendingProfilePicture) {
        await uploadProfilePicture(pendingProfilePicture);
        profilePictureSaved = true;
        refreshProfilePicture();
        const pictureResponse = await getProfilePicture();
        setProfilePicture(URL.createObjectURL(pictureResponse.data));
        setPendingProfilePicture(null);
      }
      await loadUser();
      setMessage({ type: 'success', text: t('profile.updated') });
    } catch (err) {
      setMessage({
        type: 'error',
        text: profileDetailsSaved
          ? profilePictureSaved
            ? `Your profile details and picture were saved, but the page could not refresh your account. ${err.message || 'Please reload the page.'}`
            : `Your profile details were saved, but the profile picture was not. ${err.message || 'Please try saving again.'}`
          : err.message || t('profile.updateFailed'),
      });
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, type = 'text', required = true) => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#b18a45] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20 ${errors[name] ? 'border-red-300' : 'border-[#e7dfd2]'}`}
        value={form[name]}
        onChange={handleChange}
        required={required}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex justify-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#f0e1bc] bg-[#b18a45] text-2xl font-semibold text-white shadow-sm">
                  {profilePicture
                    ? <img src={profilePicture} alt={`${saved.fullname || user?.fullname || 'User'} profile`} className="h-full w-full object-cover" />
                    : profileInitials}
                </div>
                <input
                  ref={profilePictureInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  aria-label="Choose profile picture"
                />
                <button
                  type="button"
                  onClick={() => profilePictureInput.current?.click()}
                  aria-label="Choose profile picture"
                  title="Choose profile picture — click Save Changes to save"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fffdf8] bg-[#f0e1bc] text-[#775b25] shadow-sm transition hover:bg-[#e7d3a8]"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="M13.9 3.1a1.6 1.6 0 0 1 2.3 2.3L7 14.6l-3.2.8.8-3.2 9.3-9.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m12.5 4.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {pendingProfilePicture && (
                <p className="mt-2 text-center text-xs font-medium text-[#8a6b34]">
                  New photo selected. Click Save Changes to save it.
                </p>
              )}
            </div>
            <div className="grid gap-3">
              <ReadOnlyField label={t('profile.email')} value={account.email} hint={t('profile.emailHint')} />
              {memberSince && <ReadOnlyField label={t('profile.memberSince')} value={memberSince} />}
              <ReadOnlyField label={t('profile.fullName')} value={saved.fullname} />
              <ReadOnlyField label={t('profile.phone')} value={saved.phone} />
              <ReadOnlyField label={t('profile.address')} value={saved.address || t('profile.noAddress')} />
            </div>
          </section>

          <section className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[#0f2337]">{t('profile.editTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('profile.editDesc')}</p>

            {message.text && (
              <div
                className={`mt-4 rounded-2xl border px-3 py-2.5 text-sm ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {field('fullname', t('profile.fullName'))}
              {field('phone', t('profile.phone'), 'tel')}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.address')}</label>
                <textarea
                  name="address"
                  rows={4}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#b18a45] focus:bg-white focus:ring-2 focus:ring-[#d7b57a]/20 ${errors.address ? 'border-red-300' : 'border-[#e7dfd2]'}`}
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t('profile.addressPlaceholder')}
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              <div className="mt-2 flex flex-col gap-3 border-t border-[#e7dfd2] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : t('profile.saveChanges')}
                </button>
                <Link to="/settings" className="text-center text-sm font-semibold text-[#a6813f] transition hover:text-[#775b25] hover:underline sm:text-right">
                  {t('profile.changeEmailPassword')}
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
