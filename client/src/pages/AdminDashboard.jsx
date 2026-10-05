import { useEffect, useState } from 'react';
import { Area, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import { getDashboardStats } from '../services/api';
import { SERVICE_COLORS } from '../utils/constants';

function Stat({ label, value, detail, icon }) {
  return (
    <article className="flex min-h-[156px] flex-col rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)] sm:p-5 xl:h-[clamp(132px,18vh,148px)] xl:min-h-0 xl:p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5ead5] text-[#b18a45] xl:h-8 xl:w-8">
          {icon}
        </span>
        <span className="rounded-full bg-[#f8f4ec] px-2.5 py-1 text-[9px] font-medium leading-none text-[#9a8f7c]">overview</span>
      </div>
      <p className="mt-3 min-h-4 text-xs font-medium leading-4 text-[#6e7274] xl:mt-2">{label}</p>
      <p className="mt-1 font-display text-3xl leading-9 text-[#1f3342] xl:text-2xl xl:leading-7">{value ?? 0}</p>
      <p className="mt-1 min-h-3 text-[10px] leading-3 text-[#999287]">{detail}</p>
    </article>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    const refresh = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await getDashboardStats();
        if (active) setData(response.data);
      } catch (error) {
        console.error('Failed to refresh dashboard statistics:', error);
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
  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  const { stats = {}, monthly_chart = [], appointment_chart = [], service_breakdown = [] } = data || {};
  const monthlyReservations = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date();
    monthDate.setDate(1);
    monthDate.setMonth(monthDate.getMonth() - 5 + index);
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const reservationMonth = monthly_chart.find((item) => item.month === month);
    const appointmentMonth = appointment_chart.find((item) => item.month === month);
    return {
      month,
      count: Number(reservationMonth?.count || 0),
      appointments: Number(appointmentMonth?.count || 0),
    };
  });
  const totalServices = service_breakdown.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return <DashboardLayout><div className="flex min-h-full flex-col bg-[#faf8f1] xl:h-full xl:min-h-0">
    <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:mb-4 xl:shrink-0 xl:grid-cols-4"><Stat label="Pending Reservations" value={stats.pending_reservations} detail="Requires your attention" icon="▣" /><Stat label="Pending Appointments" value={stats.pending_appointments} detail="Requires your attention" icon="◷" /><Stat label="Parish Records" value={stats.total_records} detail="Total records" icon="□" /><Stat label="Total Users" value={stats.total_users} detail="Registered users" icon="♧" /></section>
    <section className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[1fr_1.2fr]">
      <article className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-[0_8px_22px_rgba(83,65,34,0.06)] xl:flex xl:min-h-0 xl:flex-col xl:p-4">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg text-[#273746]">Monthly Requests</h2><span className="rounded-lg border border-[#e7dfd2] px-3 py-1 text-[10px] text-[#7a7d7f]">Last 6 months</span></div>
        <div className="mt-5 h-64 xl:mt-3 xl:min-h-0 xl:flex-1"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyReservations} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="reservationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d7b57a" stopOpacity={0.38} /><stop offset="100%" stopColor="#d7b57a" stopOpacity={0.04} /></linearGradient></defs><CartesianGrid stroke="#eee7db" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a857a' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8a857a' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7dfd2', fontSize: 12 }} /><Area type="monotone" dataKey="count" stroke="none" fill="url(#reservationFill)" /><Line type="monotone" dataKey="count" name="Reservations" stroke="#b18a45" strokeWidth={2.5} dot={{ r: 3, fill: '#b18a45', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#b18a45' }} /><Line type="monotone" dataKey="appointments" name="Appointments" stroke="#6688aa" strokeWidth={2.75} dot={{ r: 3, fill: '#6688aa', stroke: '#fffdf8', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#6688aa', stroke: '#fffdf8', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>
      </article>
      <article className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-[0_8px_22px_rgba(83,65,34,0.06)] xl:flex xl:min-h-0 xl:flex-col xl:p-5">
        <h2 className="font-display text-lg text-[#273746]">By Service Type</h2>
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:min-h-0 xl:flex-1">
          <div className="relative h-60 min-h-[220px] xl:h-full">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={service_breakdown} dataKey="count" nameKey="service_type" cx="50%" cy="50%" innerRadius="48%" outerRadius="74%" paddingAngle={2} stroke="none">{service_breakdown.map((item, index) => <Cell key={item.service_type || index} fill={SERVICE_COLORS[item.service_type] || '#b1a897'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[10px] text-[#7a7d7f]">Total</span><span className="font-display text-xl text-[#1f3342]">{totalServices}</span></div>
          </div>
          <div className="flex flex-col justify-center">{service_breakdown.map((item, index) => <div key={item.service_type} className={`flex min-h-9 items-center justify-between gap-3 py-2 text-sm leading-5 text-[#58616a] ${index < service_breakdown.length - 1 ? 'border-b border-[#eee7db]' : ''}`}><span className="flex min-w-0 items-center gap-2.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SERVICE_COLORS[item.service_type] || '#b1a897' }} /><span className="truncate">{item.service_type}</span></span><span className="shrink-0 font-semibold tabular-nums text-[#273746]">{totalServices ? `${Math.round((Number(item.count || 0) / totalServices) * 100)}%` : '0%'}</span></div>)}</div>
        </div>
      </article>
    </section>
  </div></DashboardLayout>;
}
