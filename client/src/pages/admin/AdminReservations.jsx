import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/cards/StatusBadge';
import Modal from '../../components/forms/Modal';
import ImagePreviewModal from '../../components/forms/ImagePreviewModal';
import { API_BASE, STATUSES } from '../../utils/constants';
import { getReservations, updateReservation, getReservationDocuments, updateReservationDocument } from '../../services/api';

const DOCUMENT_STATUS_COLORS = {
  Pending: 'bg-gray-100 text-gray-800',
  Verified: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

function parseServiceDetails(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const MARRIAGE_LABELS = [
  'fullname',
  'email',
  'phone',
  'address',
  "Bride's Full Name",
  "Bride's Age",
  "Bride's Address",
  "Bride's Contact Number",
  "Bride's Father Full Name",
  "Bride's Mother Full Name",
  "Groom's Full Name",
  "Groom's Age",
  "Groom's Address",
  "Groom's Contact Number",
  "Groom's Father Full Name",
  "Groom's Mother Full Name",
];

function decodeDisplayText(value) {
  const text = String(value ?? '');
  if (typeof document === 'undefined' || !text.includes('&')) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function extractLegacyMarriageDetails(value) {
  const source = decodeDisplayText(value).replace(/\r/g, ' ').replace(/\n/g, ' ');
  const details = {};
  MARRIAGE_LABELS.forEach((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nextLabels = MARRIAGE_LABELS
      .filter((candidate) => candidate !== label)
      .map((candidate) => candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const match = source.match(new RegExp(`${escaped}\\s*:\\s*(.*?)(?=\\s+(?:${nextLabels})\\s*:|$)`, 'i'));
    if (match?.[1]?.trim()) details[label] = match[1].trim();
  });
  return details;
}

function extractLegacyDetails(value, labels) {
  const source = decodeDisplayText(value).replace(/\r/g, ' ').replace(/\n/g, ' ');
  const details = {};
  labels.forEach((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nextLabels = labels
      .filter((candidate) => candidate !== label)
      .map((candidate) => candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const match = source.match(new RegExp(`${escaped}\\s*:\\s*(.*?)(?=\\s+(?:${nextLabels})\\s*:|$)`, 'i'));
    if (match?.[1]?.trim()) details[label] = match[1].trim();
  });
  return details;
}

const BAPTISM_LABELS = [
  'First Name', 'Middle Name', 'Last Name', 'Date of Birth', 'Place of Birth', 'Sex',
  'House / Street', 'Barangay', 'Municipality', 'Province', "Father's Full Name",
  "Mother's Full Name", 'Name of Ninong / Ninang', 'Ninong / Ninang Contact Number',
];

const FUNERAL_LABELS = [
  'Full Name of Deceased', 'Date of Death', 'Age', 'Sex', 'Civil Status',
  'Residence / Address', 'Date of Inquiry', 'Spouse / Maiden Name', 'No. of Children',
  'Cemetery Type', 'Funeral Service', 'Lot / Location', 'Kalot / Pancheon',
  'New Burial Lot', 'Existing Niche Information', 'Previous Occupant',
  'Previous Niche Occupant', 'Book', 'Page', 'Ossuary Chamber', 'Rental',
  'Maintenance Fee', 'Labor', 'Niche Information',
];

function servicePresentation(reservation, labels) {
  const jsonDetails = parseServiceDetails(reservation.service_details);
  const legacyDetails = extractLegacyDetails(reservation.requirements, labels);
  const details = { ...legacyDetails, ...jsonDetails };
  return {
    details,
    legacyNotes: Object.keys(jsonDetails).length === 0 ? decodeDisplayText(reservation.requirements || '') : '',
  };
}

function baptismPresentation(reservation) {
  const { details, legacyNotes } = servicePresentation(reservation, BAPTISM_LABELS);
  return {
    child: {
      firstName: valueFrom(details, ['child_first_name', 'First Name']),
      middleName: valueFrom(details, ['child_middle_name', 'Middle Name']),
      lastName: valueFrom(details, ['child_last_name', 'Last Name']),
      sex: valueFrom(details, ['child_sex', 'Sex']),
      birthDate: valueFrom(details, ['child_birthdate', 'Date of Birth']),
      birthPlace: valueFrom(details, ['child_birth_place', 'Place of Birth']),
    },
    address: {
      street: valueFrom(details, ['child_address_street', 'House / Street']),
      barangay: valueFrom(details, ['child_address_barangay', 'Barangay']),
      municipality: valueFrom(details, ['child_address_municipality', 'Municipality']),
      province: valueFrom(details, ['child_address_province', 'Province']),
    },
    parents: {
      father: valueFrom(details, ['father_full_name', "Father's Full Name"]),
      mother: valueFrom(details, ['mother_full_name', "Mother's Full Name"]),
    },
    sponsor: {
      name: valueFrom(details, ['sponsor_name', 'Name of Ninong / Ninang']),
      contact: valueFrom(details, ['sponsor_contact_number', 'Ninong / Ninang Contact Number']),
    },
    legacyNotes,
  };
}

function funeralPresentation(reservation) {
  const { details, legacyNotes } = servicePresentation(reservation, FUNERAL_LABELS);
  return {
    requester: {
      fullname: valueFrom(reservation, ['fullname']),
      email: valueFrom(reservation, ['email']),
      phone: valueFrom(reservation, ['phone']),
      address: valueFrom(reservation, ['address']),
    },
    deceased: {
      name: valueFrom(details, ['deceased_name', 'Full Name of Deceased']),
      age: valueFrom(details, ['age', 'Age']),
      sex: valueFrom(details, ['sex', 'Sex']),
      dateOfDeath: valueFrom(details, ['date_of_death', 'Date of Death']),
      residence: valueFrom(details, ['residence', 'Residence / Address']),
      inquiryDate: valueFrom(details, ['date_of_inquiry', 'Date of Inquiry']),
      spouse: valueFrom(details, ['spouse_maiden_name', 'Spouse / Maiden Name']),
      children: valueFrom(details, ['children_count', 'No. of Children']),
    },
    service: {
      civilStatus: valueFrom(details, ['civil_status', 'Civil Status']),
      cemetery: valueFrom(details, ['cemetery_type', 'Cemetery Type']),
      funeralService: valueFrom(details, ['funeral_service', 'Funeral Service']),
      lot: valueFrom(details, ['lot_location', 'Lot / Location']),
      niche: valueFrom(details, ['niche_information', 'Niche Information']),
      chamber: valueFrom(details, ['ossuary_chamber', 'Ossuary Chamber']),
    },
    legacyNotes,
  };
}

function valueFrom(details, keys) {
  const value = keys.map((key) => details[key]).find((item) => item !== undefined && item !== null && String(item).trim() !== '');
  return value ? decodeDisplayText(value) : '—';
}

function marriagePresentation(reservation) {
  const jsonDetails = parseServiceDetails(reservation.service_details);
  const legacyDetails = extractLegacyMarriageDetails(reservation.requirements);
  const details = { ...legacyDetails, ...jsonDetails };
  return {
    requester: {
      fullname: valueFrom(details, ['fullname', 'full_name']),
      email: valueFrom(details, ['email']),
      phone: valueFrom(details, ['phone', 'contact_number']),
      address: valueFrom(details, ['address']),
    },
    bride: {
      fullName: valueFrom(details, ['bride_full_name', "Bride's Full Name"]),
      age: valueFrom(details, ['bride_age', "Bride's Age"]),
      address: valueFrom(details, ['bride_address', "Bride's Address"]),
      contact: valueFrom(details, ['bride_contact_number', "Bride's Contact Number"]),
      father: valueFrom(details, ['bride_father_name', "Bride's Father Full Name"]),
      mother: valueFrom(details, ['bride_mother_name', "Bride's Mother Full Name"]),
    },
    groom: {
      fullName: valueFrom(details, ['groom_full_name', "Groom's Full Name"]),
      age: valueFrom(details, ['groom_age', "Groom's Age"]),
      address: valueFrom(details, ['groom_address', "Groom's Address"]),
      contact: valueFrom(details, ['groom_contact_number', "Groom's Contact Number"]),
      father: valueFrom(details, ['groom_father_name', "Groom's Father Full Name"]),
      mother: valueFrom(details, ['groom_mother_name', "Groom's Mother Full Name"]),
    },
    legacyNotes: jsonDetails && Object.keys(jsonDetails).length === 0 ? decodeDisplayText(reservation.requirements || '') : '',
  };
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-6 text-[#1f3342]">{value || '—'}</dd>
    </div>
  );
}

function DetailCard({ title, fields }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f2337]">{title}</h4>
      <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {fields.map(([label, value]) => <DetailField key={label} label={label} value={value} />)}
      </dl>
    </section>
  );
}

async function fetchReservationDocument(documentId) {
  const response = await fetch(`${API_BASE}/reservations/download.php?id=${documentId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Failed to load document';
    try {
      const payload = await response.json();
      if (payload?.message) message = payload.message;
    } catch {
      // Non-JSON error body.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  return {
    blob,
    contentType: response.headers.get('content-type') || blob.type || 'application/octet-stream',
  };
}

export default function AdminReservations() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentSummary, setDocumentSummary] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = () => {
    setLoading(true);
    getReservations(filter === 'All' ? '' : filter)
      .then((r) => setItems(r.data.reservations || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const loadDocuments = async (reservationId) => {
    setLoadingDocs(true);
    try {
      const response = await getReservationDocuments(reservationId);
      setDocuments(response.data.documents || []);
      setDocumentSummary(response.data.document_summary || null);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
      setDocumentSummary(null);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleAction = async (status) => {
    setActionLoading(true);
    try {
      let decisionRemarks = remarks;
      if (status === 'Rejected' && !decisionRemarks.trim()) {
        decisionRemarks = window.prompt('Enter the rejection reason:') || '';
        if (!decisionRemarks.trim()) return;
      }
      await updateReservation({ id: modal.id, status, remarks: decisionRemarks });
      setModal(null);
      setRemarks('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to update reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentAction = async (documentId, status, remarksText = '') => {
    try {
      await updateReservationDocument({ document_id: documentId, status, remarks: remarksText });
      if (modal) {
        await loadDocuments(modal.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to update document');
    }
  };

  const handleDownload = async (documentId, originalFilename) => {
    try {
      const { blob } = await fetchReservationDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || 'Failed to download document');
    }
  };

  const isImageMime = (mimeType) => mimeType && mimeType.startsWith('image/');

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const handlePreview = async (doc) => {
    if (isImageMime(doc.mime_type)) {
      try {
        const { blob } = await fetchReservationDocument(doc.id);
        if (previewUrl) {
          window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(window.URL.createObjectURL(blob));
        setPreviewDoc(doc);
      } catch (err) {
        alert(err.message || 'Failed to load preview');
      }
    } else {
      handleDownload(doc.id, doc.original_filename);
    }
  };

  const openModal = (reservation) => {
    setModal(reservation);
    setRemarks(reservation.remarks || '');
    loadDocuments(reservation.id);
  };

  const closeModal = () => {
    closePreview();
    setModal(null);
    setRemarks('');
    setDocuments([]);
    setDocumentSummary(null);
  };

  const stats = {
    total: items.length,
    pending: items.filter((item) => ['Pending', 'Under Review'].includes(item.status)).length,
    approved: items.filter((item) => item.status === 'Approved').length,
    rejected: items.filter((item) => item.status === 'Rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-4 shadow-[0_8px_22px_rgba(83,65,34,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Total Reservations</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.total}</span>
            <span className="rounded-full bg-[#f5ead5] px-2 py-1 text-[10px] font-medium text-[#a6813f]">This month</span>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Rejected</p>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-display text-3xl text-[#1f3342]">{stats.rejected}</span>
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Needs</span>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">Filter status</label>
        <select className="max-w-xs rounded-full border border-[#e7dfd2] bg-white px-4 py-2 text-xs text-[#58616a]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e7dfd2] bg-[#fffdf8] p-0 shadow-sm">
        {loading ? (
          <p className="px-5 py-6 text-sm text-gray-500">Loading reservations...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[#f8f4ec]">
                <tr className="border-b border-[#e7dfd2] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a7d7f]">
                  <th className="px-5 py-3">Parishioner</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Date / Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-[#eee7db] transition hover:bg-[#faf5e9]">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#273746]">{r.fullname}</div>
                      <div className="text-xs text-[#7a7d7f]">{r.email}</div>
                    </td>
                    <td className="px-5 py-4 text-[#58616a]">{r.service_type}</td>
                    <td className="px-5 py-4 text-[#58616a]">
                      {r.reservation_date} {r.reservation_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        {['Pending', 'Under Review'].includes(r.status) && (
                          <button
                            type="button"
                            className="rounded-lg border border-[#0f2337] px-3 py-1.5 text-xs font-semibold text-[#0f2337] transition hover:bg-[#0f2337] hover:text-white"
                            onClick={() => openModal(r)}
                          >
                            Review
                          </button>
                        )}
                        {r.status === 'Approved' && (
                          <button
                            type="button"
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                            onClick={() => updateReservation({ id: r.id, status: 'Completed' }).then(load)}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length === 0 && <p className="px-5 py-6 text-sm text-gray-500">No reservations found.</p>}
      </div>

      <Modal isOpen={!!modal} onClose={closeModal} title="Review Reservation" size="xl">
        {modal && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Reservation Overview</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xl font-semibold text-[#0f2337]">{modal.service_type}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {modal.reservation_date || 'Date not provided'}{modal.reservation_time ? ` • ${modal.reservation_time.slice(0, 5)}` : ''}
                  </p>
                </div>
                <StatusBadge status={modal.status} />
              </div>
              {modal.service_type === 'Marriage' ? (() => {
                const presentation = marriagePresentation(modal);
                return (
                  <div className="mt-6 space-y-5">
                    <section>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Requester Information</h4>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <DetailField label="Full Name" value={presentation.requester.fullname} />
                          <DetailField label="Email Address" value={presentation.requester.email} />
                          <DetailField label="Phone Number" value={presentation.requester.phone} />
                          <DetailField label="Address" value={presentation.requester.address} />
                        </dl>
                      </div>
                    </section>
                    <section>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Marriage Details</h4>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <DetailCard
                          title="Bride Information"
                          fields={[
                            ['Full Name', presentation.bride.fullName],
                            ['Age', presentation.bride.age],
                            ['Address', presentation.bride.address],
                            ['Contact Number', presentation.bride.contact],
                            ["Father's Full Name", presentation.bride.father],
                            ["Mother's Full Name", presentation.bride.mother],
                          ]}
                        />
                        <DetailCard
                          title="Groom Information"
                          fields={[
                            ['Full Name', presentation.groom.fullName],
                            ['Age', presentation.groom.age],
                            ['Address', presentation.groom.address],
                            ['Contact Number', presentation.groom.contact],
                            ["Father's Full Name", presentation.groom.father],
                            ["Mother's Full Name", presentation.groom.mother],
                          ]}
                        />
                      </div>
                    </section>
                    {presentation.legacyNotes && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{presentation.legacyNotes}</p>
                    )}
                  </div>
                );
              })() : modal.service_type === 'Baptism' ? (() => {
                const presentation = baptismPresentation(modal);
                return (
                  <div className="mt-6 space-y-5">
                    <DetailCard
                      title="Child Information"
                      fields={[
                        ['First Name', presentation.child.firstName],
                        ['Middle Name', presentation.child.middleName],
                        ['Last Name', presentation.child.lastName],
                        ['Sex', presentation.child.sex],
                        ['Date of Birth', presentation.child.birthDate],
                        ['Place of Birth', presentation.child.birthPlace],
                      ]}
                    />
                    <DetailCard
                      title="Address Information"
                      fields={[
                        ['House / Street', presentation.address.street],
                        ['Barangay', presentation.address.barangay],
                        ['Municipality', presentation.address.municipality],
                        ['Province', presentation.address.province],
                      ]}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailCard title="Father Information" fields={[["Father's Full Name", presentation.parents.father]]} />
                      <DetailCard title="Mother Information" fields={[["Mother's Full Name", presentation.parents.mother]]} />
                    </div>
                    <DetailCard
                      title="Sponsor / Godparent Information"
                      fields={[
                        ['Name of Ninong / Ninang', presentation.sponsor.name],
                        ['Contact Number', presentation.sponsor.contact],
                      ]}
                    />
                    {presentation.legacyNotes && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{presentation.legacyNotes}</p>
                    )}
                  </div>
                );
              })() : modal.service_type === 'Funeral' ? (() => {
                const presentation = funeralPresentation(modal);
                return (
                  <div className="mt-6 space-y-5">
                    <section>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Requester Information</h4>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <DetailField label="Full Name" value={presentation.requester.fullname} />
                          <DetailField label="Contact Number" value={presentation.requester.phone} />
                          <DetailField label="Email Address" value={presentation.requester.email} />
                          <DetailField label="Address" value={presentation.requester.address} />
                        </dl>
                      </div>
                    </section>
                    <DetailCard
                      title="Deceased Information"
                      fields={[
                        ['Full Name', presentation.deceased.name],
                        ['Age', presentation.deceased.age],
                        ['Sex', presentation.deceased.sex],
                        ['Date of Death', presentation.deceased.dateOfDeath],
                        ['Residence / Address', presentation.deceased.residence],
                        ['Date of Inquiry', presentation.deceased.inquiryDate],
                        ['Spouse / Maiden Name', presentation.deceased.spouse],
                        ['No. of Children', presentation.deceased.children],
                      ]}
                    />
                    <DetailCard
                      title="Funeral / Service Details"
                      fields={[
                        ['Civil Status', presentation.service.civilStatus],
                        ['Cemetery', presentation.service.cemetery],
                        ['Funeral Service', presentation.service.funeralService],
                        ['Lot / Location', presentation.service.lot],
                        ['Niche Information', presentation.service.niche],
                        ['Ossuary Chamber', presentation.service.chamber],
                      ]}
                    />
                    {presentation.legacyNotes && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{presentation.legacyNotes}</p>
                    )}
                  </div>
                );
              })() : (
                <p className="mt-3 break-words text-sm leading-6 text-slate-600">{decodeDisplayText(modal.requirements) || 'No additional notes.'}</p>
              )}
              {modal.service_type === 'Mass Intention' && (
                <div className="mt-3 rounded-xl border border-[#f2e4bb] bg-[#fffaf0] p-3 text-sm text-slate-700">
                  <p><strong>Requested For:</strong> {modal.intention_name || 'Not provided'}</p>
                  <p className="mt-1"><strong>Prayer Intention:</strong> {modal.prayer_intention || 'Not provided'}</p>
                  <p className="mt-1"><strong>Fee:</strong> ₱{Number(modal.payment_amount || 100).toFixed(2)}</p>
                  <p className="mt-1"><strong>Contact:</strong> {modal.phone || 'Not available'}</p>
                </div>
              )}
              {modal.service_type === 'Private Mass' && (() => {
                const details = parseServiceDetails(modal.service_details);
                return (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p><strong>Purpose:</strong> {details.purpose || 'Not provided'}</p>
                    <p className="mt-1"><strong>Location:</strong> {details.location_type || 'Not provided'}</p>
                    <p className="mt-1"><strong>Address:</strong> {[details.house_block_lot, details.barangay, details.municipality, details.province].filter(Boolean).join(', ') || 'Not provided'}</p>
                    <p className="mt-1"><strong>Location Contact:</strong> {details.location_contact_name || 'Not provided'} {details.location_contact_number ? `(${details.location_contact_number})` : ''}</p>
                  </div>
                );
              })()}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">Documents</h4>

              {loadingDocs ? (
                <div className="text-sm text-gray-500">Loading documents...</div>
              ) : documentSummary ? (
                <>
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                      <span>Document Progress</span>
                      <span>{documentSummary.verified}/{documentSummary.total_required} Verified</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(documentSummary.verified / Math.max(documentSummary.total_required, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="text-emerald-600">Verified: {documentSummary.verified}</span>
                      <span className="text-slate-500">Pending: {documentSummary.pending}</span>
                      <span className="text-red-600">Rejected: {documentSummary.rejected}</span>
                      {documentSummary.missing > 0 && <span className="text-amber-600">Missing: {documentSummary.missing}</span>}
                    </div>
                  </div>

                  {documents.length > 0 ? (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {documents.map((doc) => (
                        <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-800">{doc.document_name}</p>
                              <p className="text-xs text-slate-500">{doc.original_filename}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${DOCUMENT_STATUS_COLORS[doc.status]}`}>
                              {doc.status}
                            </span>
                          </div>

                          {doc.remarks && <p className="mb-2 text-xs italic text-slate-600">"{doc.remarks}"</p>}

                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="text-xs font-medium text-[#0f2337] underline" onClick={() => handlePreview(doc)}>
                              {isImageMime(doc.mime_type) ? 'Preview' : 'Download'}
                            </button>
                            {doc.status === 'Pending' && (
                              <>
                                <button type="button" className="text-xs font-medium text-emerald-600 underline" onClick={() => handleDocumentAction(doc.id, 'Verified')}>
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-medium text-red-600 underline"
                                  onClick={() => {
                                    const remarks = prompt('Enter rejection reason:');
                                    if (remarks?.trim()) {
                                      handleDocumentAction(doc.id, 'Rejected', remarks.trim());
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {doc.status === 'Rejected' && (
                              <button type="button" className="text-xs font-medium text-emerald-600 underline" onClick={() => handleDocumentAction(doc.id, 'Verified')}>
                                Re-verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No documents uploaded.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No documents available.</p>
              )}
            </div>

            {documentSummary && !documentSummary.complete && ['Pending', 'Under Review'].includes(modal.status) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                ⚠️ Reservation cannot be approved until all required documents are verified.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Reservation Remarks</label>
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Remarks (optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => handleAction('Approved')}
                disabled={actionLoading || loadingDocs || !documentSummary || !documentSummary.complete}
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={() => handleAction('Rejected')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ImagePreviewModal
        isOpen={!!previewDoc && !!previewUrl}
        src={previewUrl}
        alt={previewDoc?.document_name}
        title={previewDoc?.document_name || 'Image Preview'}
        onClose={closePreview}
      />
    </DashboardLayout>
  );
}
