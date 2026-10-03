import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, SquarePen, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/forms/LoadingSpinner';
import Modal from '../../components/forms/Modal';
import { useSettings } from '../../context/SettingsContext';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/api';

const EMPTY_FORM = {
  id: null,
  fullname: '',
  email: '',
  phone: '',
  address: '',
  role: 'user',
  password: '',
};

function formatApiError(err, fallback) {
  if (err?.errors && typeof err.errors === 'object') {
    const messages = Object.values(err.errors).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  return err?.message || fallback;
}

export default function AdminUsers() {
  const { t } = useSettings();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const res = await getUsers({ all: 1 });
      setUsers(res.data?.users || []);
    } catch (err) {
      if (!silent) {
        setError(formatApiError(err, t('common.error')));
        setUsers([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load(true);
    };
    const interval = window.setInterval(refreshWhenVisible, 10000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!activeMenu) return undefined;
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [activeMenu]);

  const toggleActionMenu = (event, user) => {
    if (activeMenu?.id === user.id) {
      setActiveMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const menuWidth = 160;
    const openAbove = rect.bottom + menuHeight > window.innerHeight - 8 && rect.top > menuHeight + 8;
    const preferredTop = openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8;
    setActiveMenu({
      id: user.id,
      user,
      top: Math.min(Math.max(8, preferredTop), Math.max(8, window.innerHeight - menuHeight - 8)),
      right: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, window.innerWidth - rect.right)),
    });
  };

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setForm({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      role: user.role,
      password: '',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        role: form.role,
      };

      if (form.id) {
        payload.id = form.id;
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await updateUser(payload);
        flash(t('users.updated'));
      } else {
        payload.password = form.password;
        await createUser(payload);
        flash(t('users.created'));
      }
      closeModal();
      load();
    } catch (err) {
      setError(formatApiError(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(t('users.deleteConfirm'))) return;
    setError('');
    try {
      await deleteUser(user.id);
      flash(t('users.deleted'));
      load();
    } catch (err) {
      setError(formatApiError(err, t('common.error')));
    }
  };

  const roleLabel = (role) =>
    role === 'admin' ? t('users.roleAdmin') : t('users.roleUser');

  const searchTerm = search.trim().toLowerCase();
  const visibleUsers = users.filter((user) => {
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesSearch = !searchTerm || [user.fullname, user.email, user.phone]
      .some((value) => String(value || '').toLowerCase().includes(searchTerm));
    return matchesRole && matchesSearch;
  });
  const adminCount = users.filter((user) => user.role === 'admin').length;
  const parishionerCount = users.filter((user) => user.role === 'user').length;

  return (
    <DashboardLayout>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#d7b57a] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Total Users</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{users.length}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Live</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d7b57a] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Administrators</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{adminCount}</span>
            <span className="rounded-full bg-[#f5ead0] px-2 py-1 text-xs font-medium text-[#775b25]">Admins</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d7b57a] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Parishioners</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{parishionerCount}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Members</span>
          </div>
        </div>
      </div>

      {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">{message}</div>}
      {error && !modalOpen && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{error}</div>}

      <div className="mb-6 grid items-end gap-3 rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.6fr_0.9fr_auto]">
        <input
          className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20 lg:col-span-1"
          placeholder={t('users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20"
          value={roleFilter}
          aria-label={t('users.filterRole')}
          onChange={(e) => {
            setRoleFilter(e.target.value);
          }}
        >
          <option value="">{t('users.roleAll')}</option>
          <option value="user">{t('users.roleUser')}</option>
          <option value="admin">{t('users.roleAdmin')}</option>
        </select>
        <button type="button" className="w-full rounded-full border border-[#b18a45] bg-white px-5 py-2.5 text-xs font-semibold text-[#a6813f] transition hover:bg-[#f5ead5] lg:w-auto" onClick={openCreate}>
          + {t('users.addUser')}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="max-h-[min(68vh,760px)] min-h-[280px] overflow-auto rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-0 shadow-sm">
            <div>
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 z-10 bg-[#f8f4ec]">
                  <tr className="border-b border-[#e7dfd2] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">
                    <th className="px-5 py-3">{t('profile.fullName')}</th>
                    <th className="px-5 py-3">{t('profile.email')}</th>
                    <th className="px-5 py-3">{t('profile.phone')}</th>
                    <th className="px-5 py-3">{t('profile.role')}</th>
                    <th className="px-5 py-3">{t('profile.memberSince')}</th>
                    <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#eee7db] transition hover:bg-[#faf5e9]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-full bg-[#14212b] text-xs font-bold text-white shadow-sm ring-2 ring-white">
                            {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[#273746]">{user.fullname}</div>
                            <div className="text-xs text-[#7a7d7f]">ID #{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#58616a]">{user.email}</td>
                      <td className="px-5 py-4 text-[#58616a]">{user.phone}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-[#0f2337]/10 text-[#0f2337]'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{user.created_at?.slice(0, 10)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label={`${t('common.actions')} for ${user.fullname}`}
                            aria-expanded={activeMenu?.id === user.id}
                            className="rounded-md p-2 text-[#7a7d7f] transition hover:bg-[#f1e7d1] hover:text-[#8a6b34]"
                            onClick={(event) => toggleActionMenu(event, user)}
                          >
                            <SquarePen className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">{users.length ? 'No users match your filters.' : t('users.noUsers')}</p>
            )}
          </div>
        </>
      )}

      {activeMenu && createPortal(
        <div className="fixed z-[1000] w-40 rounded-md border border-[#e7dfd2] bg-[#fffdf8] py-1 text-left shadow-lg" style={{ top: activeMenu.top, right: activeMenu.right }}>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#34495a] hover:bg-[#f8f6f1]" onClick={() => { setActiveMenu(null); openEdit(activeMenu.user); }}>
            <Pencil className="h-4 w-4" />{t('users.editUser')}
          </button>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50" onClick={() => { setActiveMenu(null); handleDelete(activeMenu.user); }}>
            <Trash2 className="h-4 w-4" />{t('common.delete')}
          </button>
        </div>,
        document.body,
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={form.id ? t('users.editUser') : t('users.addUser')}
        size="lg"
      >
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-[#0f2337] via-[#12314b] to-[#1c4463] p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#d7b57a]" aria-hidden="true">
                <path d="M16 19V17C16 15.3 14.7 14 13 14H11C9.3 14 8 15.3 8 17V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19V17.5C5 16.1 6.1 15 7.5 15H8.5M19 19V17.5C19 16.1 17.9 15 16.5 15H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b57a]">Account</p>
              <p className="text-lg font-semibold">{form.id ? t('users.editUser') : t('users.addUser')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.fullName')}</label>
              <input
                className="input-field"
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.email')}</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.phone')}</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.address')}</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t('profile.addressPlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t('profile.role')}</label>
              <select
                className="input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">{t('users.roleUser')}</option>
                <option value="admin">{t('users.roleAdmin')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {form.id ? t('users.passwordOptional') : t('users.password')}
              </label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!form.id}
                minLength={form.password ? 8 : undefined}
              />
              <p className="mt-1 text-xs text-gray-500">{t('users.passwordHint')}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button type="button" className="btn-outline" onClick={closeModal}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
