import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSystemLogs } from '../../services/api';

const modules = ['Authentication', 'Registration', 'Reservation', 'Appointment', 'Records', 'Documents', 'Users', 'Notifications', 'SMS', 'System'];

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{status}</span>;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', module: '', role: '', status: '', date: '', sort: 'newest' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getSystemLogs({ ...filters, page: pagination.page, limit: pagination.limit })
      .then((response) => { setLogs(response.data.logs || []); setPagination(response.data.pagination || pagination); })
      .catch((requestError) => setError(requestError.message || 'Failed to load system logs.'))
      .finally(() => setLoading(false));
  }, [filters, pagination.page]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a6813f]">Administration</p>
        <h1 className="mt-2 font-display text-3xl text-[#1f3342]">System Logs</h1>
        <p className="mt-2 text-sm text-[#7a7d7f]">Monitor important activities and changes performed within the system.</p>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6">
        <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search logs..." className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs outline-none focus:border-[#b18a45] xl:col-span-2" />
        <select value={filters.module} onChange={(event) => updateFilter('module', event.target.value)} className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs"><option value="">All Modules</option>{modules.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs"><option value="">All Roles</option><option value="admin">Admin</option><option value="user">Parishioner</option></select>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs"><option value="">All Status</option><option value="Success">Success</option><option value="Failed">Failed</option></select>
        <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs"><option value="newest">Newest</option><option value="oldest">Oldest</option></select>
        <input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} className="rounded-full border border-[#e7dfd2] bg-white px-4 py-2.5 text-xs" />
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-xl border border-[#e7dfd2] bg-[#fffdf8] shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-[#f8f4ec]"><tr className="border-b border-[#e7dfd2] text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a7d7f]"><th className="px-5 py-3">Date &amp; Time</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Module</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-500">Loading system logs...</td></tr> : logs.map((log) => <tr key={log.id} onClick={() => setSelected(log)} className="cursor-pointer border-b border-[#eee7db] transition hover:bg-[#faf5e9]"><td className="whitespace-nowrap px-5 py-4 text-[#7a7d7f]">{new Date(log.created_at).toLocaleString()}</td><td className="px-5 py-4 font-medium text-[#273746]">{log.user_name || 'System'}</td><td className="px-5 py-4 text-[#58616a]">{log.user_role === 'admin' ? 'Admin' : log.user_role === 'user' ? 'Parishioner' : '-'}</td><td className="px-5 py-4 font-medium text-[#273746]">{log.action}</td><td className="px-5 py-4 text-[#58616a]">{log.module}</td><td className="max-w-sm px-5 py-4 text-[#58616a]"><span className="block truncate" title={log.description}>{log.description}</span></td><td className="px-5 py-4"><StatusBadge status={log.status} /></td></tr>)}</tbody></table></div>
        {!loading && logs.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">No system logs found.</p>}
      </div>
      {pagination.pages > 1 && <div className="mt-5 flex items-center justify-center gap-4"><button disabled={pagination.page === 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Previous</button><span className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page === pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50">Next</button></div>}

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onClick={() => setSelected(null)}><section className="w-full max-w-lg rounded-2xl bg-[#fffdf8] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a6813f]">Audit detail</p><h2 className="mt-2 font-display text-2xl text-[#1f3342]">{selected.action}</h2></div><button type="button" onClick={() => setSelected(null)} className="text-2xl text-slate-400" aria-label="Close">&times;</button></div><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Date &amp; Time</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd></div><div><dt className="text-xs text-slate-500">User / Role</dt><dd>{selected.user_name || 'System'} / {selected.user_role || '-'}</dd></div><div><dt className="text-xs text-slate-500">Module</dt><dd>{selected.module}</dd></div><div><dt className="text-xs text-slate-500">Status</dt><dd><StatusBadge status={selected.status} /></dd></div><div><dt className="text-xs text-slate-500">Target</dt><dd>{selected.target_type || '-'} {selected.target_id ? `#${selected.target_id}` : ''}</dd></div><div><dt className="text-xs text-slate-500">IP Address</dt><dd>{selected.ip_address || '-'}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-slate-500">Description</dt><dd className="mt-1 text-[#273746]">{selected.description}</dd></div></dl></section></div>}
    </DashboardLayout>
  );
}
