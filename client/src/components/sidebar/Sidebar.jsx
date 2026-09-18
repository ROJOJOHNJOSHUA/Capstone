import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  IconAppointments,
  IconCalendar,
  IconDashboard,
  IconNotifications,
  IconProfile,
  IconReservations,
  IconSettings,
} from '../icons/ParishionerNavIcons';

function IconFolder({ className = 'h-[18px] w-[18px]' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 6.5h6l2 2h9v9.25A2.25 2.25 0 0118.25 20h-13A2.25 2.25 0 013 17.75V7.75a1.25 1.25 0 011.25-1.25z" /><path d="M3.5 9h17" /></svg>;
}

function IconChart({ className = 'h-[18px] w-[18px]' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16" /><path d="M7 15l3-4 3 2 5-7" /></svg>;
}

function IconChurch({ className = 'h-5 w-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21h16M6 21V10l6-4 6 4v11M9 21v-5h6v5M12 3v5M9.5 5.5h5" /></svg>;
}

export default function Sidebar({ isMobileOpen = false, onClose = () => {} }) {
  const { isAdmin } = useAuth();
  const { t } = useSettings();

  const userPageLinks = [
    { to: '/dashboard', label: t('nav.dashboard'), Icon: IconDashboard },
    { to: '/make-request', label: 'Make a Request', Icon: IconReservations },
    { to: '/reservations', label: t('nav.viewReservation'), Icon: IconReservations },
    { to: '/appointments', label: t('nav.viewAppointment'), Icon: IconAppointments },
    { to: '/settings', label: t('nav.settings'), Icon: IconSettings },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: t('nav.dashboard'), Icon: IconDashboard },
    { to: '/admin/parish-calendar', label: 'Parish Calendar', Icon: IconCalendar },
    { to: '/admin/reservations', label: t('sidebar.reservations'), Icon: IconReservations },
    { to: '/admin/appointments', label: t('sidebar.appointments'), Icon: IconAppointments },
    { to: '/admin/records', label: t('sidebar.records'), Icon: IconFolder },
    { to: '/admin/users', label: t('sidebar.users'), Icon: IconProfile },
    { to: '/admin/sms-logs', label: 'SMS Logs', Icon: IconNotifications },
    { to: '/admin/system-logs', label: 'System Logs', Icon: IconNotifications },
    { to: '/admin/reports', label: 'Reports', Icon: IconChart },
    { to: '/settings', label: t('nav.settings'), Icon: IconSettings },
  ];

  if (isAdmin) {
    return (
      <aside
        className={`fixed left-0 top-16 sm:top-20 z-40 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] w-[82vw] max-w-[280px] overflow-y-auto border-r border-[#e7dfd2] bg-[#f7f3eb] shadow-[0_12px_28px_rgba(83,65,34,0.08)] transition-transform duration-200 dark:border-gray-700 dark:bg-gray-900 xl:top-0 xl:h-screen xl:w-64 xl:translate-x-0 xl:overflow-hidden xl:shadow-[0_12px_28px_rgba(83,65,34,0.08)] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-[#e7dfd2] px-2 pb-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a25c] text-[#b18a45]"><IconChurch className="h-5 w-5" /></span>
            <span className="leading-tight"><span className="block font-display text-sm font-bold text-[#273746]">Holy Family Parish</span><span className="block text-[7px] uppercase tracking-[0.18em] text-[#9a8666]">Faith · Service · Community</span></span>
          </div>
          <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto" aria-label="Admin navigation">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#b18a45] text-white shadow-md shadow-[#b18a45]/20'
                      : 'text-[#58616a] hover:bg-[#f1e7d1] hover:text-[#273746] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition-colors duration-200 ${
                        isActive ? 'bg-white/15 text-white' : 'bg-[#eee5d6] text-[#a6813f] group-hover:bg-[#e9dcc0] group-hover:text-[#273746]'
                      }`}
                    >
                      {link.Icon ? <link.Icon className="h-[18px] w-[18px]" /> : link.icon}
                    </span>
                    <span className="leading-snug">{link.label}</span>
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-[#d7b57a]" aria-hidden="true" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed left-0 top-16 sm:top-20 z-40 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] w-[82vw] max-w-[280px] overflow-y-auto border-r border-[#e7dfd2] bg-[#fbf8f1] shadow-[0_12px_28px_rgba(83,65,34,0.08)] transition-transform duration-200 dark:border-gray-700 dark:bg-gray-900 xl:top-0 xl:h-screen xl:w-64 xl:translate-x-0 xl:overflow-hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
      }`}
    >
      <div className="flex flex-col h-full px-3 py-5">
          <div className="mb-4 hidden shrink-0 items-center gap-2 border-b border-[#e7dfd2] px-2 pb-4 xl:flex">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a25c] text-[#b18a45]"><IconChurch className="h-5 w-5" /></span>
            <span className="leading-tight"><span className="block font-display text-sm font-bold text-[#273746]">Holy Family Parish</span><span className="block text-[7px] uppercase tracking-[0.18em] text-[#9a8666]">Faith · Service · Community</span></span>
          </div>
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto mt-1" aria-label="Parishioner navigation">
          {userPageLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#b18a45] text-white shadow-md shadow-[#b18a45]/20'
                    : 'text-[#58616a] dark:text-gray-300 hover:bg-[#f1e7d1] dark:hover:bg-gray-800 hover:text-[#273746] dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors duration-200 ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-[#eee5d6] text-[#a6813f] dark:bg-gray-800 dark:text-parish-gold group-hover:bg-[#e9dcc0]'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="leading-snug">{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d7b57a] shrink-0" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-2 pt-6">
          <div className="border-t border-[#e7dfd2] pt-5 dark:border-gray-700">
            <p className="font-display text-[13px] italic leading-relaxed text-[#9a8666] dark:text-gray-400">
              “The sacraments are signs of God’s love and a source of grace in our lives.”
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
