import { useEffect, useState } from 'react';
import { CalendarCheck2, ClipboardCheck } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import { getReservations, getAppointments } from '../services/api';

const isApprovedReservation = (status) => ['Approved', 'Paid'].includes(status);
const isApprovedAppointment = (status) => status === 'Approved';

function getMonthlyRequests(reservations, appointments) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 5 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    return {
      key,
      reservations: 0,
      appointments: 0,
    };
  });
  const monthByKey = new Map(months.map((month) => [month.key, month]));

  reservations.forEach((reservation) => {
    const month = monthByKey.get(String(reservation.created_at || '').slice(0, 7));
    if (month) month.reservations += 1;
  });
  appointments.forEach((appointment) => {
    const month = monthByKey.get(String(appointment.created_at || '').slice(0, 7));
    if (month) month.appointments += 1;
  });

  return months;
}

function ApprovalStat({ icon: Icon, label, value }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#e9e0d1] bg-[#fffdf8] p-4 shadow-[0_8px_24px_rgba(83,65,34,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(83,65,34,0.09)] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#b18a45] to-[#e5d0a8]" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7efdf] text-[#a6813f]">
          <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e9e0d1] bg-[#fcfaf5] px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#7d715c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5d9870]" aria-hidden="true" />
          LIVE
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#83745a]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="font-display text-3xl leading-tight tabular-nums text-[#2f2a22]">{value}</p>
        <p className="pb-1 text-[11px] text-[#8c877d]">Approved</p>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    const refresh = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const [reservationResponse, appointmentResponse] = await Promise.all([
          getReservations(),
          getAppointments(),
        ]);
        if (active) {
          setReservations(reservationResponse.data.reservations || []);
          setAppointments(appointmentResponse.data.appointments || []);
        }
      } catch (error) {
        console.error('Failed to refresh dashboard requests:', error);
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    const interval = window.setInterval(refreshWhenVisible, 10000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const approvedReservations = reservations.filter((reservation) => isApprovedReservation(reservation.status)).length;
  const approvedAppointments = appointments.filter((appointment) => isApprovedAppointment(appointment.status)).length;
  const monthlyRequests = getMonthlyRequests(reservations, appointments);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1440px] space-y-4">
        <section aria-label="Live approval counts" className="grid gap-4 sm:grid-cols-2">
          <ApprovalStat
            icon={ClipboardCheck}
            label="Approved Reservations"
            value={approvedReservations}
          />
          <ApprovalStat
            icon={CalendarCheck2}
            label="Approved Appointments"
            value={approvedAppointments}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e9e0d1] bg-[#fffdf8] shadow-[0_8px_24px_rgba(83,65,34,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0eadd] px-5 py-3 sm:px-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#2f2a22]">Monthly Requests</h2>
              <p className="mt-1 text-[11px] text-[#8c877d]">Activity over the past six months</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#716957]">
                <span className="h-2 w-2 rounded-full bg-[#b18a45]" aria-hidden="true" />
                Reservations
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#716957]">
                <span className="h-2 w-2 rounded-full bg-[#6688aa]" aria-hidden="true" />
                Appointments
              </span>
              <span className="rounded-lg border border-[#e9e0d1] bg-[#fcfaf5] px-2.5 py-1 text-[10px] font-medium text-[#7a7162]">
                Last 6 months
              </span>
            </div>
          </div>
          <div className="px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={monthlyRequests} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#eee7db" vertical={false} />
                <XAxis
                  dataKey="key"
                  tick={{ fontSize: 11, fill: '#8a857a' }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickCount={5}
                  tick={{ fontSize: 11, fill: '#8a857a' }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e7dfd2',
                    boxShadow: '0 8px 24px rgba(83,65,34,0.10)',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#5b5344', fontWeight: 600 }}
                  cursor={{ stroke: '#d9cdb8', strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  name="Reservations"
                  stroke="#b18a45"
                  strokeWidth={2.75}
                  dot={{ r: 3, fill: '#b18a45', stroke: '#fffdf8', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#b18a45', stroke: '#fffdf8', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#6688aa"
                  strokeWidth={2.75}
                  dot={{ r: 3, fill: '#6688aa', stroke: '#fffdf8', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#6688aa', stroke: '#fffdf8', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
