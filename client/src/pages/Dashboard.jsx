import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/cards/StatusBadge';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getReservations, getAppointments } from '../services/api';
import { SERVICE_LABELS } from '../utils/constants';

function IconDoc({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2.75h8L19.25 8v13.25H6z" />
      <path d="M13.75 3v5.25H19" />
      <path d="M9 12.5h6.5M9 16h6.5" />
    </svg>
  );
}

function IconHourglass({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.5 3h11M6.5 21h11M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9M16 3c0 4.5-8 4.5-8 9s8 4.5 8 9" />
    </svg>
  );
}

function IconCheckBadge({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.25l2.5 2.5 4.75-5" />
    </svg>
  );
}

function IconCal({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10.5h17" />
    </svg>
  );
}

function StatCard({ icon, label, value, note, noteClass = 'text-[#4e7a5a]' }) {
  return (
    <div className="rounded-[22px] border border-[#ece4d3] bg-[#fffdf8] p-5 shadow-[0_14px_30px_rgba(83,65,34,0.06)]">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5ead5] text-[#a6813f]">{icon}</span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7c5f]">{label}</p>
      <p className="mt-1 font-display text-4xl text-[#2f2a22]">{value}</p>
      <div className={`mt-2 text-xs font-medium ${noteClass}`}>{note}</div>
    </div>
  );
}

const withinWeek = (item) => {
  const raw = item?.created_at || item?.updated_at;
  if (!raw) return false;
  const created = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(created.getTime())) return false;
  return Date.now() - created.getTime() <= 7 * 24 * 60 * 60 * 1000;
};

const isApproved = (status) => ['Approved', 'Paid'].includes(status);
const isPending = (status) => ['Pending', 'Submitted', 'In Review', 'Under Review'].includes(status);

function manilaTodayIso() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

export default function Dashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getReservations(), getAppointments()])
      .then(([r, a]) => {
        setReservations(r.data.reservations || []);
        setAppointments(a.data.appointments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRequests = reservations.length + appointments.length;
  const pendingRequests = reservations.filter((r) => isPending(r.status)).length
    + appointments.filter((a) => isPending(a.status)).length;
  const approvedRequests = reservations.filter((r) => isApproved(r.status)).length
    + appointments.filter((a) => isApproved(a.status)).length;

  const todayIso = manilaTodayIso();
  const upcomingAppointments = appointments.filter(
    (a) => a.appointment_date >= todayIso && !['Cancelled', 'Rejected', 'Completed'].includes(a.status)
  ).length;

  const newThisWeek = reservations.filter(withinWeek).length + appointments.filter(withinWeek).length;
  const approvedThisWeek =
    reservations.filter((r) => isApproved(r.status) && withinWeek(r)).length
    + appointments.filter((a) => isApproved(a.status) && withinWeek(a)).length;

  const recentRequests = [
    ...reservations.map((r) => ({
      id: `res-${r.id}`,
      date: r.reservation_date,
      time: r.reservation_time || '',
      service: SERVICE_LABELS[r.service_type] || r.service_type,
      status: r.status,
    })),
    ...appointments.map((a) => ({
      id: `apt-${a.id}`,
      date: a.appointment_date,
      time: a.appointment_time || '',
      service: a.purpose,
      status: a.status,
    })),
  ]
    .sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`))
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IconDoc />}
          label="Total Requests"
          value={totalRequests}
          note={newThisWeek > 0 ? `+${newThisWeek} this week` : 'All time'}
        />
        <StatCard
          icon={<IconHourglass />}
          label="Pending Requests"
          value={pendingRequests}
          note={pendingRequests === 0 ? 'All caught up' : 'Awaiting review'}
        />
        <StatCard
          icon={<IconCheckBadge />}
          label="Approved"
          value={approvedRequests}
          note={approvedThisWeek > 0 ? `+${approvedThisWeek} this week` : 'No updates yet'}
        />
        <StatCard
          icon={<IconCal />}
          label="Upcoming Appointments"
          value={upcomingAppointments}
          note={
            <Link to="/appointments" className="inline-flex items-center gap-1 transition hover:text-[#8d6928]">
              View details <span aria-hidden="true">→</span>
            </Link>
          }
          noteClass="text-[#a6813f]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-[24px] border border-[#ece4d3] bg-[#fffdf8] shadow-[0_14px_30px_rgba(83,65,34,0.06)]">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-display text-lg font-semibold text-[#2f2a22]">Recent Requests</h2>
            <Link to="/reservations" className="text-xs font-semibold text-[#a6813f] transition hover:text-[#8d6928]">
              View All →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto px-2 pb-3">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-[#9a8666]">
                  <th className="px-3 pb-3 font-semibold">Date</th>
                  <th className="px-3 pb-3 font-semibold">Service</th>
                  <th className="px-3 pb-3 font-semibold">Purpose</th>
                  <th className="px-3 pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id} className="border-t border-[#f1e9da] transition hover:bg-[#faf5ea]">
                    <td className="px-3 py-3.5 text-[#5b5344]">{request.date}</td>
                    <td className="px-3 py-3.5 font-medium text-[#2f2a22]">{request.service}</td>
                    <td className="px-3 py-3.5 text-[#9a8f78]">—</td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={request.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentRequests.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-[#9a8f78]">
                No requests yet.{' '}
                <Link to="/make-request" className="font-semibold text-[#a6813f]">
                  Make your first request
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#ece4d3] bg-[#fffdf8] shadow-[0_14px_30px_rgba(83,65,34,0.06)]">
          <div className="relative h-44">
            <img src="/faith.png" alt="Inside the parish church" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />
          </div>
          <div className="p-5">
            <p className="font-display text-lg italic leading-snug text-[#4a4033]">
              Let us keep your faith journey close to our hearts.
            </p>
            <Link
              to="/make-request"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#b18a45] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(177,138,69,0.28)] transition hover:-translate-y-0.5 hover:bg-[#967338]"
            >
              Make a Request
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
