import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/forms/LoadingSpinner';
import { STATUSES, SERVICE_TYPES } from '../../utils/constants';
import { getReportsSummary, getReportsRecords, exportReports } from '../../services/api';

const COLORS = ['#b18a45', '#5e9b70', '#6d8fb5', '#c97868', '#273746', '#d7b57a'];

function ReportStat({ title, value, icon, color = 'blue' }) {
  const accent = {
    blue: 'border-l-[#273746] bg-[#f1f3f4] text-[#273746]',
    gold: 'border-l-[#b18a45] bg-[#f5ead5] text-[#a6813f]',
    green: 'border-l-[#5e9b70] bg-[#e8f2eb] text-[#477c58]',
    red: 'border-l-[#c97868] bg-[#f8eae7] text-[#a95548]',
  }[color] || 'border-l-[#273746] bg-[#f1f3f4] text-[#273746]';

  return (
    <article className="flex min-h-[112px] items-center justify-between gap-3 rounded-xl border border-[#e7dfd2] border-l-4 bg-[#fffdf8] p-4 shadow-[0_6px_18px_rgba(83,65,34,0.05)]">
      <div className="min-w-0">
        <p className="min-h-8 text-xs font-medium leading-4 text-[#6e7274]">{title}</p>
        <p className="mt-1 font-display text-3xl leading-9 text-[#1f3342]">{value}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${accent}`} aria-hidden="true">{icon}</span>
    </article>
  );
}

function fillYearMonths(chart, year) {
  const countsByMonth = new Map(chart.map((item) => [item.month, Number(item.count) || 0]));
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    return { month, count: countsByMonth.get(month) || 0 };
  });
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [filterType, setFilterType] = useState('all');
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportCategory, setReportCategory] = useState('all');
  const [recordsChart, setRecordsChart] = useState([]);

  useEffect(() => {
    loadReports();
  }, [filterType, period, year, month, statusFilter, reportCategory, dateRange]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadReports(true);
    };
    const interval = window.setInterval(refreshWhenVisible, 10000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [filterType, period, year, month, statusFilter, reportCategory, dateRange, searchTerm]);

  const loadReports = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      const params = {
        from: dateRange.from,
        to: dateRange.to,
        period,
        year,
        month,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: reportCategory !== 'all' ? reportCategory : undefined,
        search: searchTerm || undefined,
      };

      const [summaryResponse, recordsResponse] = await Promise.all([
        getReportsSummary(params),
        getReportsRecords({ ...params, period: 'yearly' }),
      ]);
      setData(summaryResponse.data);
      setRecordsChart(recordsResponse.data?.records_chart || []);
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load reports');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const params = {
        format,
        from: dateRange.from,
        to: dateRange.to,
        period,
        year,
        month,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: reportCategory !== 'all' ? reportCategory : undefined,
        search: searchTerm || undefined,
      };

      const response = await exportReports(params);
      
      // Create blob and download
      const blob = new Blob([response], { 
        type: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${format}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-[#e9c9c2] bg-[#fff8f6] p-5 shadow-sm">
          <p className="text-sm text-[#a95548]">{error}</p>
          <button onClick={loadReports} className="mt-4 rounded-lg bg-[#b18a45] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#967338]">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const { summary = {}, reservations_chart = [], appointments_chart = [], users_by_role = [], reservation_status = [], appointment_status = [], service_breakdown = [] } = data || {};
  const reservationsByMonth = fillYearMonths(reservations_chart, year);
  const appointmentsByMonth = fillYearMonths(appointments_chart, year);
  const recordsByMonth = fillYearMonths(recordsChart, year);
  const recordsOverview = reservationsByMonth.map((reservation, index) => ({
    month: reservation.month,
    reservations: reservation.count,
    appointments: appointmentsByMonth[index].count,
    records: recordsByMonth[index].count,
  }));

  return (
    <DashboardLayout>
      <div className="mb-6 rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">From Date</label>
            <input
              type="date"
              className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">To Date</label>
            <input
              type="date"
              className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Period</label>
            <select className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a]" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Year</label>
            <select className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a]" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Month</label>
            <select className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a]" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Status</label>
            <select className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Report Category</label>
            <select className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a]" value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="reservations">Reservations</option>
              <option value="appointments">Appointments</option>
              <option value="users">Users</option>
              <option value="records">Records</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Search</label>
            <input
              type="text"
              className="w-full rounded-full border border-[#e7dfd2] bg-white px-3.5 py-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={loadReports} className="rounded-full bg-[#b18a45] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#967338]">Apply Filters</button>
          <button
            onClick={() => {
              setDateRange({ from: '', to: '' });
              setFilterType('all');
              setPeriod('monthly');
              setYear(new Date().getFullYear());
              setMonth(new Date().getMonth() + 1);
              setSearchTerm('');
              setStatusFilter('all');
              setReportCategory('all');
            }}
            className="rounded-full border border-[#d7b57a] bg-white px-5 py-2.5 text-xs font-semibold text-[#a6813f] transition hover:bg-[#f5ead5]"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <ReportStat title="Total Parishioners" value={summary.total_parishioners ?? 0} icon="👥" />
        <ReportStat title="Total Users" value={summary.total_users ?? 0} icon="👤" />
        <ReportStat title="Pending Reservations" value={summary.pending_reservations ?? 0} icon="⏳" color="gold" />
        <ReportStat title="Approved Reservations" value={summary.approved_reservations ?? 0} icon="✅" color="green" />
        <ReportStat title="Rejected Reservations" value={summary.rejected_reservations ?? 0} icon="❌" color="red" />
        <ReportStat title="Completed Reservations" value={summary.completed_reservations ?? 0} icon="🏁" color="green" />
        <ReportStat title="Pending Appointments" value={summary.pending_appointments ?? 0} icon="⏳" color="gold" />
        <ReportStat title="Approved Appointments" value={summary.approved_appointments ?? 0} icon="✅" color="green" />
        <ReportStat title="Completed Appointments" value={summary.completed_appointments ?? 0} icon="🏁" color="green" />
        <ReportStat title="Cancelled Appointments" value={summary.cancelled_appointments ?? 0} icon="🚫" color="red" />
        <ReportStat title="Total Records" value={summary.total_records ?? 0} icon="📁" />
        <ReportStat title="Today's Reservations" value={summary.today_reservations ?? 0} icon="📅" />
        <ReportStat title="Today's Appointments" value={summary.today_appointments ?? 0} icon="📋" />
        <ReportStat title="Monthly Reservations" value={summary.monthly_reservations ?? 0} icon="📊" />
        <ReportStat title="Monthly Appointments" value={summary.monthly_appointments ?? 0} icon="📊" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg text-[#273746]">Records Overview</h2><div className="flex flex-wrap gap-3 text-[10px] text-[#6e7274]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#b18a45]" />Reservations</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#5e9b70]" />Appointments</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#6d8fb5]" />Records</span></div></div>
          <ResponsiveContainer width="100%" height={300}><BarChart data={recordsOverview} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#eee7db" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a857a' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8a857a' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7dfd2', fontSize: 12 }} /><Bar dataKey="reservations" name="Reservations" fill="#b18a45" radius={[3, 3, 0, 0]} /><Bar dataKey="appointments" name="Appointments" fill="#5e9b70" radius={[3, 3, 0, 0]} /><Bar dataKey="records" name="Records" fill="#6d8fb5" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Reservations Per Month</h2>
            <span className="rounded-full bg-[#f5ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a6813f]">Volume</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reservationsByMonth}>
              <CartesianGrid stroke="#eee7db" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} interval={0} tick={{ fontSize: 10, fill: '#7a7d7f' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7a7d7f' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7dfd2', fontSize: 12 }} />
              <Bar dataKey="count" fill="#b18a45" barSize={20} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Appointments Per Month</h2>
            <span className="rounded-full bg-[#f5ead0] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#775b25]">Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentsByMonth}>
              <CartesianGrid stroke="#eee7db" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} interval={0} tick={{ fontSize: 10, fill: '#7a7d7f' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7a7d7f' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7dfd2', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#5e9b70" strokeWidth={2.5} dot={{ fill: '#5e9b70' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Users By Role</h2>
            <span className="rounded-full bg-[#edf1f4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#526b80]">Audience</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={users_by_role}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {users_by_role.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Reservation Status</h2>
            <span className="rounded-full bg-[#e8f2eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#477c58]">Status</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reservation_status}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {reservation_status.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Appointment Status</h2>
            <span className="rounded-full bg-[#f5ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a6813f]">Flow</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointment_status}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {appointment_status.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-[#273746]">Service Type Breakdown</h2>
            <span className="rounded-full bg-[#f5ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a6813f]">Services</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={service_breakdown} layout="vertical">
              <CartesianGrid stroke="#eee7db" vertical={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#7a7d7f' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="service_type" type="category" width={120} tick={{ fontSize: 11, fill: '#58616a' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e7dfd2', fontSize: 12 }} />
              <Bar dataKey="count" fill="#b18a45" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
