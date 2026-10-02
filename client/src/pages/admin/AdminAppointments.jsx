import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, Check, Eye, MessageSquareText, SquarePen, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/forms/Modal';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { getAppointments, updateAppointment } from '../../services/api';

const APPOINTMENT_STATUS_STYLES = {
  Pending: 'bg-[#f5ead0] text-[#775b25]',
  Approved: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-[#efede8] text-[#69665d]',
};

function AppointmentStatusBadge({ status }) {
  const label = status === 'Pending' ? 'Under Review' : status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${APPOINTMENT_STATUS_STYLES[status] || 'bg-[#efede8] text-[#69665d]'}`}>{label}</span>;
}

export default function AdminAppointments() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [remarks, setRemarks] = useState({});
  const [showRemarks, setShowRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

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

  const toggleActionMenu = (event, appointment) => {
    if (activeMenu?.id === appointment.id) {
      setActiveMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const itemCount = 1 + (canActPending(appointment.status) ? 3 : 0)
      + (canActApproved(appointment.status) ? 2 : 0)
      + (canViewRemarks(appointment.status) && appointment.remarks ? 1 : 0);
    const menuHeight = itemCount * 36 + 8;
    const menuWidth = 176;
    const openAbove = rect.bottom + menuHeight > window.innerHeight - 8 && rect.top > menuHeight + 8;
    const preferredTop = openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8;
    setActiveMenu({
      id: appointment.id,
      appointment,
      top: Math.min(Math.max(8, preferredTop), Math.max(8, window.innerHeight - menuHeight - 8)),
      right: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, window.innerWidth - rect.right)),
    });
  };

  const load = () => {
    setLoading(true);
    return getAppointments(filter === 'All' ? '' : filter)
      .then((r) => setItems(r.data.appointments || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const searchQuery = search.trim().toLowerCase();
  const filteredAppointments = !searchQuery
    ? items
    : items.filter((a) => {
        const haystack = [
          a.fullname,
          a.email,
          a.phone,
          a.purpose,
          a.appointment_date,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ');
        return haystack.includes(searchQuery);
      });

  const resolveRemarks = (id) => {
    if (Object.prototype.hasOwnProperty.call(remarks, id)) {
      return remarks[id];
    }
    const item = items.find((a) => a.id === id);
    return item?.remarks || '';
  };

  const setStatus = async (id, status) => {
    if (status === 'Rejected' && !resolveRemarks(id).trim()) {
      setShowRemarks((prev) => ({ ...prev, [id]: true }));
      alert('Please provide a reason before rejecting this appointment.');
      return;
    }
    setActionLoading(id);
    try {
      await updateAppointment({ id, status, remarks: resolveRemarks(id) });
      setRemarks((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setShowRemarks((prev) => ({ ...prev, [id]: false }));
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRemarks = (id) => {
    setShowRemarks((prev) => {
      const opening = !prev[id];
      if (opening && !Object.prototype.hasOwnProperty.call(remarks, id)) {
        const item = items.find((a) => a.id === id);
        setRemarks((r) => ({ ...r, [id]: item?.remarks || '' }));
      }
      return { ...prev, [id]: opening };
    });
  };

  const canActPending = (status) => status === 'Pending';
  const canActApproved = (status) => status === 'Approved';
  const canViewRemarks = (status) =>
    ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'].includes(status);

  const stats = {
    total: items.length,
    pending: items.filter((item) => item.status === 'Pending').length,
    approved: items.filter((item) => item.status === 'Approved').length,
    completed: items.filter((item) => item.status === 'Completed').length,
    rejected: items.filter((item) => item.status === 'Rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Total Appointments</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.total}</span>
            <span className="rounded-full bg-[#f1e7d1] px-2 py-1 text-xs font-medium text-[#775b25]">All</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Pending</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.pending}</span>
            <span className="rounded-full bg-[#f5ead0] px-2 py-1 text-xs font-medium text-[#775b25]">Review</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Approved</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.approved}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Active</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Completed</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.completed}</span>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Done</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Rejected</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.rejected}</span>
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Needs</span>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Filter status</label>
            <select className="h-11 w-full max-w-xs rounded-md border border-[#e7dfd2] bg-white px-4 text-sm text-[#1f3342] outline-none focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All Status</option>
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'Pending' ? 'Under Review' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 lg:max-w-lg">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Search</label>
            <input
              type="search"
              className="h-11 w-full rounded-md border border-[#e7dfd2] bg-white px-4 text-sm text-[#1f3342] outline-none placeholder:text-[#92999d] focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20"
              placeholder="Search by name, email, phone, service or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e7dfd2] bg-[#fffdf8] shadow-sm">
        {loading ? (
            <p className="px-5 py-6 text-sm text-[#6e7274]">Loading appointments...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-[#f8f6f1]">
                <tr className="border-b border-[#e7dfd2] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">
                  <th className="px-5 py-3">Parishioner</th>
                  <th className="px-5 py-3">Date / Time</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id} className="border-b border-[#eee9df] align-top transition hover:bg-[#fbfaf7]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#1f3342]">{a.fullname}</div>
                      <div className="text-xs text-[#7a7d7f]">{a.email}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#58616a]">
                      {a.appointment_date} {a.appointment_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-4 max-w-xs text-[#58616a]" title={a.purpose}>
                      <span className="block truncate">{a.purpose}</span>
                    </td>
                    <td className="px-5 py-4">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`Actions for ${a.fullname}`}
                          aria-expanded={activeMenu?.id === a.id}
                          className="rounded-md p-2 text-[#7a7d7f] transition hover:bg-[#f1e7d1] hover:text-[#8a6b34]"
                          onClick={(event) => toggleActionMenu(event, a)}
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                      </div>

                      {showRemarks[a.id] && (
                        <div className="mt-3 min-w-[260px] max-w-sm rounded-md border border-[#e7dfd2] bg-[#fbfaf7] p-3">
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Remarks</label>
                          <textarea
                            className="input-field mb-2 text-sm"
                            rows={2}
                            placeholder="Add admin notes..."
                            value={remarks[a.id] ?? ''}
                            onChange={(e) =>
                              setRemarks((prev) => ({ ...prev, [a.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                            disabled={actionLoading === a.id}
                            onClick={() => setStatus(a.id, a.status)}
                          >
                            {actionLoading === a.id ? 'Saving...' : 'Save Remarks'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredAppointments.length === 0 && (
          <p className="px-5 py-6 text-sm text-[#6e7274]">No appointments found.</p>
        )}
      </div>

      {activeMenu && createPortal(
        <div
          className="fixed z-[1000] w-44 rounded-md border border-[#e7dfd2] bg-[#fffdf8] py-1 text-left shadow-lg"
          style={{ top: activeMenu.top, right: activeMenu.right }}
        >
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#34495a] hover:bg-[#f8f6f1]" onClick={() => { setActiveMenu(null); setSelectedAppointment(activeMenu.appointment); }}>
            <Eye className="h-4 w-4" />View Details
          </button>
          {canActPending(activeMenu.appointment.status) && <>
            <button type="button" disabled={actionLoading === activeMenu.id} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" onClick={() => { setActiveMenu(null); setStatus(activeMenu.id, 'Approved'); }}>
              <Check className="h-4 w-4" />Approve
            </button>
            <button type="button" disabled={actionLoading === activeMenu.id} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={() => { setActiveMenu(null); setStatus(activeMenu.id, 'Rejected'); }}>
              <X className="h-4 w-4" />Reject
            </button>
            <button type="button" disabled={actionLoading === activeMenu.id} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#6e7274] hover:bg-[#f8f6f1] disabled:opacity-50" onClick={() => { setActiveMenu(null); setStatus(activeMenu.id, 'Cancelled'); }}>
              <Ban className="h-4 w-4" />Cancel
            </button>
          </>}
          {canActApproved(activeMenu.appointment.status) && <>
            <button type="button" disabled={actionLoading === activeMenu.id} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50" onClick={() => { setActiveMenu(null); setStatus(activeMenu.id, 'Completed'); }}>
              <Check className="h-4 w-4" />Complete
            </button>
            <button type="button" disabled={actionLoading === activeMenu.id} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#6e7274] hover:bg-[#f8f6f1] disabled:opacity-50" onClick={() => { setActiveMenu(null); setStatus(activeMenu.id, 'Cancelled'); }}>
              <Ban className="h-4 w-4" />Cancel
            </button>
          </>}
          {canViewRemarks(activeMenu.appointment.status) && activeMenu.appointment.remarks && <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#6e7274] hover:bg-[#f8f6f1]" onClick={() => { setActiveMenu(null); toggleRemarks(activeMenu.id); }}>
            <MessageSquareText className="h-4 w-4" />{showRemarks[activeMenu.id] ? 'Hide Remarks' : 'View Remarks'}
          </button>}
        </div>,
        document.body,
      )}

      <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title="Appointment Details" size="lg">
        {selectedAppointment && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#7a7d7f]">Appointment ID</p>
                <p className="font-semibold text-[#1f3342]">APT-{String(selectedAppointment.id).padStart(5, '0')}</p>
              </div>
              <AppointmentStatusBadge status={selectedAppointment.status} />
            </div>
            <dl className="grid gap-4 rounded-md bg-[#fbfaf7] p-4 sm:grid-cols-2">
              <div><dt className="text-xs text-[#7a7d7f]">Parishioner</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.fullname}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Email</dt><dd className="break-words font-medium text-[#1f3342]">{selectedAppointment.email}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Contact Number</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.phone || '—'}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Address</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.address || '—'}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Purpose</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.purpose}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Submitted</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.created_at}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Requested Date</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.appointment_date}</dd></div>
              <div><dt className="text-xs text-[#7a7d7f]">Requested Time</dt><dd className="font-medium text-[#1f3342]">{selectedAppointment.appointment_time?.slice(0, 5)}</dd></div>
            </dl>
            {selectedAppointment.remarks && <div className="rounded-md border border-[#e7dfd2] bg-[#f8f6f1] p-3"><span className="font-semibold text-[#34495a]">Remarks:</span> <span className="text-[#58616a]">{selectedAppointment.remarks}</span></div>}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
