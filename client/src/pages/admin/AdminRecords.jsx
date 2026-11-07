import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/forms/LoadingSpinner';
import Modal from '../../components/forms/Modal';
import ImagePreviewModal from '../../components/forms/ImagePreviewModal';
import { SERVICE_TYPES } from '../../utils/constants';
import {
  createRecordFolder,
  deleteRecordFolder,
  deleteReservationRecord,
  deleteRecordFile,
  deleteUnlinkedRecord,
  fetchReservationDocument,
  fetchRecordFile,
  getDocumentRequirements,
  getRecordArchiveDetail,
  getRecordArchive,
  getRecordFiles,
  getRecordFolders,
  getReservationRecordDetail,
  getUnlinkedRecordDetail,
  renameReservationDocument,
  deleteReservationDocument,
  uploadRecordFile,
  uploadReservationDocument,
} from '../../services/api';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function formatModified(value) {
  if (!value) return '—';
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime())
    ? formatDate(value)
    : parsed.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      });
}

function formatFileSize(value) {
  const size = Number(value) || 0;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function recordKey(record) {
  return record.reservation_id ?? `unlinked-${record.parish_record_id}`;
}

function recordFolderParams(context) {
  if (context.folder) return { parent_type: 'folder', parent_id: context.folder.id };
  if (context.record) return { parent_type: 'record', parent_id: context.record.parish_record_id };
  if (context.reservation) return { parent_type: 'reservation', parent_id: context.reservation.reservation_id };
  if (context.service) return { parent_type: 'service', service_type: context.service };
  return { parent_type: 'root' };
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="mb-4 text-sm text-red-700">{message}</p>
      <button type="button" className="btn-primary text-sm" onClick={onRetry}>Try again</button>
    </div>
  );
}

function UploadedDocumentsSection({ documents, searchQuery = '', onDownload, onRename, onDelete }) {
  const documentRows = Array.isArray(documents) ? documents.filter((doc) => doc && typeof doc === 'object') : [];
  const blobUrlsRef = useRef([]);
  const [thumbnails, setThumbnails] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewBlobUrlRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const matchingDocuments = documentRows.filter((doc) => {
    if (doc.mime_type !== 'application/pdf' && !String(doc.mime_type || '').startsWith('image/')) return false;
    const query = String(searchQuery || '').trim().toLowerCase();
    return !query || String(doc.original_filename || doc.document_name || '').toLowerCase().startsWith(query);
  });
  const previewDocumentKey = matchingDocuments.map((doc) => doc.id).join('|');

  useEffect(() => {
    let cancelled = false;
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
    setThumbnails({});

    matchingDocuments.filter((doc) => String(doc.mime_type || '').startsWith('image/')).forEach(async (doc) => {
      try {
        const { blob } = await fetchReservationDocument(doc.id);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.push(url);
        setThumbnails((previous) => ({ ...previous, [doc.id]: url }));
      } catch {
        if (!cancelled) {
          setThumbnails((previous) => {
            const next = { ...previous };
            delete next[doc.id];
            return next;
          });
        }
      }
    });

    return () => {
      cancelled = true;
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, [previewDocumentKey]);

  useEffect(() => () => {
    if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
  }, []);

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

  const toggleFileMenu = (event, doc) => {
    event.stopPropagation();
    if (activeMenu?.doc.id === doc.id) {
      setActiveMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    const menuWidth = 144;
    const openAbove = rect.bottom + menuHeight > window.innerHeight - 8 && rect.top > menuHeight + 8;
    const preferredTop = openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8;
    setActiveMenu({
      doc,
      top: Math.min(Math.max(8, preferredTop), Math.max(8, window.innerHeight - menuHeight - 8)),
      right: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, window.innerWidth - rect.right)),
    });
  };

  const openPreview = (doc) => {
    const url = thumbnails[doc.id];
    if (url) {
      setPreviewDoc(doc);
      setPreviewUrl(url);
    }
  };

  const viewDocument = async (doc) => {
    if (doc.mime_type?.startsWith('image/')) {
      if (thumbnails[doc.id]) {
        openPreview(doc);
        return;
      }
      try {
        const { blob } = await fetchReservationDocument(doc.id);
        const url = URL.createObjectURL(blob);
        previewBlobUrlRef.current = url;
        setPreviewDoc(doc);
        setPreviewUrl(url);
      } catch (error) {
        window.alert(error.message || 'Failed to open file.');
      }
      return;
    }
    try {
      const { blob } = await fetchReservationDocument(doc.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      window.alert(error.message || 'Failed to open file.');
    }
  };

  return (
    <>
      {matchingDocuments.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#e7dfd2] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-y-1 text-left">
              <colgroup><col style={{ width: '40%' }} /><col style={{ width: '17%' }} /><col style={{ width: '23%' }} /><col style={{ width: '14%' }} /><col style={{ width: '6%' }} /></colgroup>
              <thead className="bg-[#f8f7f3] text-xs font-semibold text-[#34495a]"><tr className="h-11 border-b border-[#e7dfd2]">
                <th className="px-3">Name</th><th className="px-3">Type</th><th className="px-3">Modified</th><th className="px-3">Size</th><th className="px-3 text-center"><MoreVertical className="mx-auto h-4 w-4" /></th>
              </tr></thead>
              <tbody className="text-sm text-[#6e7274]">
                {matchingDocuments.map((doc) => {
                  const image = doc.mime_type?.startsWith('image/');
                  const pdf = doc.mime_type === 'application/pdf';
                  const filename = doc.original_filename || doc.document_name || 'File';
                  return (
                    <tr key={doc.id} className="group h-[3.45rem] transition-colors">
                      <td className="overflow-hidden rounded-l-md border-y border-l border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">
                        <button type="button" className="flex max-w-full items-center gap-3 text-left text-[#1f3342]" onClick={() => viewDocument(doc)} aria-label={`Open ${filename}`} title={`${filename} · ${formatFileSize(doc.file_size)}`}>
                          {image && thumbnails[doc.id]
                            ? <img src={thumbnails[doc.id]} alt="" className="h-7 w-7 shrink-0 rounded-sm border border-[#e7dfd2] object-cover" />
                            : <FileText className={`h-6 w-6 shrink-0 ${pdf ? 'text-red-500' : 'text-blue-500'}`} strokeWidth={1.7} />}
                          <span className="block min-w-0 truncate font-semibold" title={filename}>{filename}</span>
                        </button>
                      </td>
                      <td className="truncate border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{pdf ? 'PDF Document' : 'Image'}</td>
                      <td className="truncate whitespace-nowrap border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{formatModified(doc.uploaded_at)}</td>
                      <td className="truncate whitespace-nowrap border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{formatFileSize(doc.file_size)}</td>
                      <td className="relative rounded-r-md border-y border-r border-[#e7dfd2] bg-white px-3 text-center transition-colors group-hover:bg-[#fbfaf7]">
                        <button type="button" aria-label={`Actions for ${filename}`} aria-expanded={activeMenu?.doc.id === doc.id} className="text-[#697989] hover:text-[#a6813f]" onClick={(event) => toggleFileMenu(event, doc)}><MoreVertical className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeMenu && createPortal(
        <div className="fixed z-[1000] w-36 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg" style={{ top: activeMenu.top, right: activeMenu.right }}>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onDownload(activeMenu.doc); }}><Download className="h-3.5 w-3.5" />Download</button>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onRename(activeMenu.doc); }}><Pencil className="h-3.5 w-3.5" />Rename</button>
          <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setActiveMenu(null); onDelete(activeMenu.doc); }}><Trash2 className="h-3.5 w-3.5" />Delete</button>
        </div>,
        document.body,
      )}
      <ImagePreviewModal isOpen={!!previewDoc && !!previewUrl} src={previewUrl} alt={previewDoc?.original_filename} title={previewDoc?.document_name || 'Image Preview'} onClose={() => {
        if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
        setPreviewDoc(null);
        setPreviewUrl(null);
      }} />
    </>
  );
}

function RecordDetailsContent({ detail, searchQuery, onDownload, onRename, onDelete }) {
  const recordDetail = detail && typeof detail === 'object' ? detail : {};
  const documents = Array.isArray(recordDetail.documents) ? recordDetail.documents : [];
  return <UploadedDocumentsSection documents={documents} searchQuery={searchQuery} onDownload={onDownload} onRename={onRename} onDelete={onDelete} />;
}

function FolderContentTable({ rows, loading, emptyMessage, onOpenFolder, onOpenFile, onDeleteFile, onDeleteFolder, onDeleteRecord }) {
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

  const toggleRowMenu = (event, row) => {
    if (activeMenu?.row.id === row.id) {
      setActiveMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = row.file ? 112 : row.customFolder ? 80 : 44;
    const menuWidth = 144;
    const openAbove = rect.bottom + menuHeight > window.innerHeight - 8 && rect.top > menuHeight + 8;
    const preferredTop = openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8;
    setActiveMenu({
      row,
      top: Math.min(Math.max(8, preferredTop), Math.max(8, window.innerHeight - menuHeight - 8)),
      right: Math.min(window.innerWidth - menuWidth - 8, Math.max(8, window.innerWidth - rect.right)),
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[#e7dfd2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-y-1 text-left">
          <colgroup><col style={{ width: '40%' }} /><col style={{ width: '17%' }} /><col style={{ width: '23%' }} /><col style={{ width: '14%' }} /><col style={{ width: '6%' }} /></colgroup>
          <thead className="bg-[#f8f7f3] text-xs font-semibold text-[#34495a]"><tr className="h-11 border-b border-[#e7dfd2]">
            <th className="px-3">Name <span className="ml-1 text-[#a6813f]">↕</span></th><th className="px-3">Type</th><th className="px-3">Modified <span className="ml-1 text-[#a6813f]">↕</span></th><th className="px-3">Size</th><th className="px-3 text-center"><MoreVertical className="mx-auto h-4 w-4" /></th>
          </tr></thead>
          <tbody className="text-sm text-[#6e7274]">
            {rows.map((row) => <tr key={row.id} className="group h-[3.45rem] cursor-pointer transition-colors" onClick={() => row.file ? onOpenFile(row.file, true) : onOpenFolder(row)}>
              <td className="overflow-hidden rounded-l-md border-y border-l border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]"><button type="button" className="flex max-w-full items-center gap-3 text-left text-[#1f3342]" onClick={(event) => { event.stopPropagation(); row.file ? onOpenFile(row.file, true) : onOpenFolder(row); }}>
                {row.file ? <FileText className={`h-6 w-6 shrink-0 ${row.file.mime_type === 'application/pdf' ? 'text-red-500' : 'text-blue-500'}`} strokeWidth={1.7} /> : <Folder className="h-6 w-6 shrink-0 fill-[#d7b57a] text-[#b18a45]" strokeWidth={1.5} />}
                <span className="min-w-0 truncate"><span className="block truncate font-semibold">{row.name}</span>{row.record && <span className="block truncate text-[11px] font-normal text-[#8a8d8f]">{row.record.reservation_id ? `Reservation #${row.record.reservation_id}` : 'Manual archive record'}</span>}</span>
              </button></td>
              <td className="truncate border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{row.file ? (row.file.mime_type === 'application/pdf' ? 'PDF Document' : row.file.mime_type?.startsWith('image/') ? 'Image' : row.type) : row.record ? row.record.service_type : 'Folder'}</td>
              <td className="truncate whitespace-nowrap border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{formatModified(row.modified || row.file?.uploaded_at || row.records?.[0]?.created_at)}</td>
              <td className="truncate whitespace-nowrap border-y border-[#e7dfd2] bg-white px-3 transition-colors group-hover:bg-[#fbfaf7]">{row.file ? formatFileSize(row.file.file_size) : '—'}</td>
              <td className="relative rounded-r-md border-y border-r border-[#e7dfd2] bg-white px-3 text-center transition-colors group-hover:bg-[#fbfaf7]">
                <button type="button" aria-label={`Actions for ${row.name}`} aria-expanded={activeMenu?.row.id === row.id} className="text-[#697989] hover:text-[#a6813f]" onClick={(event) => { event.stopPropagation(); toggleRowMenu(event, row); }}><MoreVertical className="h-4 w-4" /></button>
              </td>
            </tr>)}
            {!rows.length && <tr><td colSpan="5" className="px-4 py-12 text-center text-sm text-slate-500">{loading ? 'Loading folder contents…' : emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {activeMenu && createPortal(
        <div className="fixed z-[1000] w-36 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg" style={{ top: activeMenu.top, right: activeMenu.right }}>
          {activeMenu.row.file ? <>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onOpenFile(activeMenu.row.file, true); }}><Eye className="h-3.5 w-3.5" />Preview</button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onOpenFile(activeMenu.row.file, false); }}><Download className="h-3.5 w-3.5" />Download</button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setActiveMenu(null); onDeleteFile(activeMenu.row.file); }}><Trash2 className="h-3.5 w-3.5" />Delete</button>
          </> : activeMenu.row.record ? <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setActiveMenu(null); onDeleteRecord(activeMenu.row.record); }}><Trash2 className="h-3.5 w-3.5" />Delete record</button> : activeMenu.row.customFolder ? <>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onOpenFolder(activeMenu.row); }}><Folder className="h-3.5 w-3.5" />Open</button>
            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setActiveMenu(null); onDeleteFolder(activeMenu.row.customFolder); }}><Trash2 className="h-3.5 w-3.5" />Delete folder</button>
          </> : <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => { setActiveMenu(null); onOpenFolder(activeMenu.row); }}><Folder className="h-3.5 w-3.5" />Open</button>}
        </div>,
        document.body,
      )}
    </div>
  );
}

function formatApiError(error, fallback = 'Failed to load records. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}

function unwrapRecordDetail(response) {
  let candidate = response;
  for (let depth = 0; depth < 4; depth++) {
    if (!candidate || typeof candidate !== 'object') return null;
    if (candidate.parishioner && typeof candidate.parishioner === 'object') return candidate;
    candidate = candidate.data;
  }
  return null;
}

export default function AdminRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', service: '', status: '' });
  const [searchText, setSearchText] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const archiveRequestSequence = useRef(0);
  const [selectedService, setSelectedService] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [documentRequirements, setDocumentRequirements] = useState({});
  const [folderTrail, setFolderTrail] = useState([]);
  const [folderList, setFolderList] = useState([]);
  const [fileList, setFileList] = useState([]);
  const fileScopeKeyRef = useRef('');
  const [folderListLoading, setFolderListLoading] = useState(false);
  const [folderError, setFolderError] = useState('');
  const [folderRefresh, setFolderRefresh] = useState(0);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const folderFileInputRef = useRef(null);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeRowMenu, setActiveRowMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [renameDocumentTarget, setRenameDocumentTarget] = useState(null);
  const [renameDocumentName, setRenameDocumentName] = useState('');
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState(null);
  const [documentActionError, setDocumentActionError] = useState('');
  const [documentActionLoading, setDocumentActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const load = useCallback(async () => {
    const requestSequence = ++archiveRequestSequence.current;
    setLoading(true);
    setError('');
    try {
      let response = await getRecordArchive(filters);
      if (requestSequence !== archiveRequestSequence.current) return;
      let loadedRecords = response.data.records || [];
      if (filters.service && loadedRecords.length === 0) {
        response = await getRecordArchive({ q: '', service: '', status: '' });
        if (requestSequence !== archiveRequestSequence.current) return;
        loadedRecords = (response.data.records || []).filter((record) => record.service_type === filters.service);
      }
      setRecords(loadedRecords);
    } catch (loadError) {
      if (requestSequence !== archiveRequestSequence.current) return;
      setError(formatApiError(loadError));
      setRecords([]);
    } finally {
      if (requestSequence === archiveRequestSequence.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getDocumentRequirements().then((response) => setDocumentRequirements(response.data || {})).catch(() => setDocumentRequirements({}));
  }, []);

  const currentCustomFolder = folderTrail[folderTrail.length - 1] || null;
  const parentContext = currentCustomFolder
    ? { folder: currentCustomFolder }
    : viewRecord?.is_unlinked
      ? { record: viewRecord }
      : viewRecord
        ? { reservation: viewRecord }
        : selectedService
          ? { service: selectedService }
          : {};
  const folderScopeParams = recordFolderParams(parentContext);
  const folderScopeKey = `${folderScopeParams.parent_type}:${folderScopeParams.parent_id || folderScopeParams.service_type || 'root'}`;

  useEffect(() => {
    let cancelled = false;
    const params = { ...folderScopeParams, q: searchText.trim() };
    if (fileScopeKeyRef.current !== folderScopeKey) {
      fileScopeKeyRef.current = folderScopeKey;
      setFileList([]);
    }
    setFolderListLoading(true);
    Promise.allSettled([getRecordFolders(folderScopeParams), getRecordFiles(params)])
      .then(([folderResult, fileResult]) => {
        if (cancelled) return;
        const errors = [];
        if (folderResult.status === 'fulfilled') {
          setFolderList(folderResult.value.data?.folders || []);
        } else {
          setFolderList([]);
          errors.push(formatApiError(folderResult.reason, 'Unable to load folders.'));
        }
        if (fileResult.status === 'fulfilled') {
          setFileList(fileResult.value.data?.files || []);
        } else {
          errors.push(formatApiError(fileResult.reason, 'Unable to load files.'));
        }
        setFolderError(errors.join(' '));
      })
      .finally(() => {
        if (!cancelled) setFolderListLoading(false);
      });
    return () => { cancelled = true; };
  }, [folderScopeKey, searchText, folderRefresh]);
  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const closeRecord = () => {
    setViewRecord(null);
    setDetail(null);
    setDetailError('');
    setDocumentSearch('');
    setUploadDocumentType('');
    setFolderTrail([]);
  };

  const openRecord = async (record) => {
    archiveRequestSequence.current += 1;
    setLoading(false);
    setError('');
    setViewRecord(record);
    setDetail(null);
    setDetailError('');
    setDocumentSearch('');
    setSearchText('');
    setFolderTrail([]);
    setActiveRowMenu(null);
    setDetailLoading(true);
    try {
      const response = record.is_unlinked
        ? await getUnlinkedRecordDetail(record.parish_record_id)
        : await getReservationRecordDetail(record.reservation_id);
      let detailData = unwrapRecordDetail(response);
      const reservationId = Number(record.reservation_id);
      if (!record.is_unlinked && detailData) {
        const reservations = (Array.isArray(detailData.reservations) ? detailData.reservations : [])
          .filter((item) => Number(item.id) === reservationId);
        if (reservations.length === 0) {
          detailData = null;
        } else {
          detailData = {
            ...detailData,
            reservations: [reservations[0]],
            documents: (Array.isArray(detailData.documents) ? detailData.documents : [])
              .filter((document) => Number(document.reservation_id) === reservationId),
            appointments: [],
            parish_records: [],
          };
        }
      }
      if (!detailData && !record.is_unlinked && record.user_id) {
        const parishionerResponse = await getRecordArchiveDetail(record.user_id);
        const parishionerDetail = unwrapRecordDetail(parishionerResponse);
        if (parishionerDetail) {
          detailData = {
            ...parishionerDetail,
            parishioner: {
              ...parishionerDetail.parishioner,
              fullname: record.fullname || parishionerDetail.parishioner.fullname,
            },
            reservations: (parishionerDetail.reservations || []).filter((item) => Number(item.id) === reservationId),
            documents: (parishionerDetail.documents || []).filter((document) => Number(document.reservation_id) === reservationId),
            appointments: [],
            parish_records: [],
          };
        }
      }
      if (!detailData) {
        throw new Error('No record information was returned.');
      }
      setDetail(detailData);
    } catch (loadError) {
      setDetailError(formatApiError(loadError, 'Failed to load record details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const openService = (service) => {
    closeRecord();
    setLoading(true);
    setError('');
    setSelectedService(service);
    setSearchText('');
    setPage(1);
    setFilters({ q: '', service: service === 'Others' ? '' : service, status: '' });
  };

  const openRoot = () => {
    closeRecord();
    setLoading(true);
    setError('');
    setSelectedService('');
    setSearchText('');
    setPage(1);
    setFilters({ q: '', service: '', status: '' });
  };

  const goToServiceRoot = () => {
    if (viewRecord) closeRecord();
    setFolderTrail([]);
    setSearchText('');
    setPage(1);
    setFilters({ q: '', service: selectedService === 'Others' ? '' : selectedService, status: '' });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (viewRecord) {
      setDocumentSearch(searchText.trim());
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);
    if (viewRecord) {
      setDocumentSearch(value);
    }
    setPage(1);
  };

  const createFolder = async (event) => {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      setFolderError('Folder name is required.');
      return;
    }
    setCreatingFolder(true);
    setFolderError('');
    try {
      await createRecordFolder({ ...folderScopeParams, name });
      setNewFolderName('');
      setCreateFolderOpen(false);
      setSearchText('');
      setDocumentSearch('');
      setFilters((previous) => ({ ...previous, q: '' }));
      setPage(1);
      setSuccessMessage('Folder created successfully.');
      setFolderRefresh((value) => value + 1);
    } catch (createError) {
      setFolderError(formatApiError(createError, 'Unable to create folder. Please try again.'));
    } finally {
      setCreatingFolder(false);
    }
  };

  const openCustomFolder = (folder) => {
    setFolderTrail((trail) => [...trail, { id: Number(folder.id), name: folder.name }]);
    setSearchText('');
    setPage(1);
    setActiveRowMenu(null);
  };

  const uploadManagerFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFolderError('Files must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }
    const formData = new FormData();
    Object.entries(folderScopeParams).forEach(([key, value]) => formData.append(key, String(value)));
    formData.append('file', file);
    setFileUploading(true);
    setFolderError('');
    try {
      const response = await uploadRecordFile(formData);
      const savedFile = response?.data?.data ?? response?.data ?? response;
      if (!savedFile?.id) throw new Error('Upload succeeded, but the saved file details were not returned.');
      const savedRow = {
        id: savedFile.id,
        original_filename: savedFile.original_filename || file.name,
        mime_type: savedFile.mime_type || file.type || 'application/octet-stream',
        file_size: Number(savedFile.file_size ?? file.size),
        uploaded_at: savedFile.uploaded_at || new Date().toISOString(),
      };
      setFileList((previous) => [
        savedRow,
        ...previous.filter((existingFile) => Number(existingFile.id) !== Number(savedFile.id)),
      ]);
      setSearchText('');
      setDocumentSearch('');
      setFilters((previous) => ({ ...previous, q: '' }));
      setPage(1);
      setFolderRefresh((value) => value + 1);
      setSuccessMessage('File uploaded successfully.');
    } catch (uploadError) {
      setFolderError(formatApiError(uploadError, 'Unable to upload file. Please try again.'));
    } finally {
      setFileUploading(false);
      event.target.value = '';
    }
  };

  const openManagerFile = async (file, inline = false) => {
    setActiveRowMenu(null);
    try {
      const previewable = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.mime_type);
      const shouldPreview = inline && previewable;
      const blob = await fetchRecordFile(file.id, shouldPreview);
      const url = URL.createObjectURL(blob);
      if (shouldPreview) {
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = file.original_filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }
    } catch (fileError) {
      setFolderError(formatApiError(fileError, 'Unable to open this file.'));
    }
  };

  const removeManagerFile = async (file) => {
    if (!window.confirm(`Delete ${file.original_filename}?`)) return;
    setActiveRowMenu(null);
    try {
      await deleteRecordFile(file.id);
      setFolderRefresh((value) => value + 1);
      setSuccessMessage('File deleted.');
    } catch (deleteErrorValue) {
      setFolderError(formatApiError(deleteErrorValue, 'Unable to delete this file.'));
    }
  };

  const removeCustomFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and everything inside it?`)) return;
    setFolderError('');
    try {
      await deleteRecordFolder(folder.id);
      setFolderRefresh((value) => value + 1);
      setSuccessMessage('Folder deleted.');
    } catch (deleteErrorValue) {
      setFolderError(formatApiError(deleteErrorValue, 'Unable to delete this folder.'));
    }
  };

  const deleteRecordKey = (record) => record.reservation_id ?? `unlinked-${record.parish_record_id}`;
  const openDelete = (record) => {
    setDeleteError('');
    setDeleteTarget(record);
  };
  const closeDelete = () => {
    if (!deleting) {
      setDeleteTarget(null);
      setDeleteError('');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (deleteTarget.is_unlinked) await deleteUnlinkedRecord(deleteTarget.parish_record_id);
      else await deleteReservationRecord(deleteTarget.reservation_id);
      setRecords((previous) => previous.filter((record) => deleteRecordKey(record) !== deleteRecordKey(deleteTarget)));
      if (viewRecord && deleteRecordKey(viewRecord) === deleteRecordKey(deleteTarget)) closeRecord();
      setDeleteTarget(null);
      setSuccessMessage('The official record and its associated documents were deleted.');
    } catch (deleteErrorValue) {
      setDeleteError(formatApiError(deleteErrorValue, 'The record could not be deleted. Please try again.'));
    } finally {
      setDeleting(false);
    }
  };

  const serviceRecords = SERVICE_TYPES.map((service) => ({
    id: `service-${service}`,
    name: service,
    service,
    records: records.filter((record) => !record.is_unlinked && record.service_type === service),
  }));
  const otherRecords = records.filter((record) => record.is_unlinked);
  const rootFolders = [...serviceRecords, {
    id: 'service-Others', name: 'Others', service: 'Others', records: otherRecords,
  }];
  const officialFolderRows = (viewRecord || folderTrail.length)
    ? []
    : selectedService
      ? (selectedService === 'Others' && !folderTrail.length
          ? otherRecords
          : selectedService === 'Others'
            ? []
            : serviceRecords.find((folder) => folder.service === selectedService)?.records || [])
        .map((record) => ({ id: recordKey(record), name: record.fullname, type: 'Folder', modified: record.created_at || record.latest_activity_at, record }))
        .filter((row) => !filters.q || row.name.toLowerCase().includes(filters.q.toLowerCase()))
      : !viewRecord && !folderTrail.length
        ? rootFolders.filter((folder) => !searchText.trim() || folder.name.toLowerCase().includes(searchText.trim().toLowerCase()))
        : [];
  const customFolderRows = folderList.map((folder) => ({ id: `folder-${folder.id}`, name: folder.name, type: 'Folder', modified: folder.updated_at || folder.created_at, customFolder: folder }));
  const fileSearchPrefix = searchText.trim().toLowerCase();
  const managerFileRows = fileList
    .filter((file) => !fileSearchPrefix || String(file.original_filename || '').toLowerCase().startsWith(fileSearchPrefix))
    .map((file) => {
      const extension = String(file.original_filename || '').split('.').pop()?.toLowerCase();
      const type = file.mime_type === 'application/pdf'
        ? 'PDF Document'
        : file.mime_type?.startsWith('image/')
          ? 'Image'
          : `${(extension || 'file').toUpperCase()} File`;
      return { id: `file-${file.id}`, name: file.original_filename, type, modified: file.uploaded_at, size: formatFileSize(file.file_size), file };
    });
  const hasFileSearch = Boolean(fileSearchPrefix);
  const recordSearchRows = hasFileSearch
    ? records
      .filter((record) => String(record.fullname || '').toLowerCase().startsWith(fileSearchPrefix))
      .map((record) => ({ id: `search-${recordKey(record)}`, name: record.fullname, type: record.service_type, modified: record.created_at || record.latest_activity_at, record }))
    : [];
  const folderRows = hasFileSearch ? [...recordSearchRows, ...managerFileRows] : [...officialFolderRows, ...customFolderRows, ...managerFileRows];
  const pageCount = Math.max(1, Math.ceil(folderRows.length / PAGE_SIZE));
  const pageRows = folderRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uploadOptions = viewRecord && !viewRecord.is_unlinked
    ? (documentRequirements[viewRecord.service_type] || []).filter((requirement) => !detail?.documents?.some((doc) => doc.document_type === requirement.type && doc.status !== 'Rejected'))
    : [];

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  useEffect(() => {
    if (uploadOptions.length && !uploadOptions.some((option) => option.type === uploadDocumentType)) setUploadDocumentType(uploadOptions[0].type);
    else if (!uploadOptions.length && uploadDocumentType) setUploadDocumentType('');
  }, [viewRecord, detail, documentRequirements, uploadOptions, uploadDocumentType]);

  const downloadReservationFile = async (doc) => {
    try {
      const { blob } = await fetchReservationDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.original_filename || doc.document_name || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadError) {
      setDetailError(formatApiError(downloadError, 'The file could not be downloaded.'));
    }
  };

  const openRenameDocument = (doc) => {
    setDocumentActionError('');
    setRenameDocumentName(doc.original_filename || doc.document_name || '');
    setRenameDocumentTarget(doc);
  };

  const saveRenamedDocument = async (event) => {
    event.preventDefault();
    if (!renameDocumentTarget || documentActionLoading) return;
    setDocumentActionLoading(true);
    setDocumentActionError('');
    try {
      const filename = renameDocumentName.trim();
      await renameReservationDocument({
        document_id: renameDocumentTarget.id,
        original_filename: filename,
      });
      setDetail((previous) => previous ? {
        ...previous,
        documents: (previous.documents || []).map((doc) => Number(doc.id) === Number(renameDocumentTarget.id)
          ? { ...doc, original_filename: filename }
          : doc),
      } : previous);
      setRenameDocumentTarget(null);
      setSuccessMessage('File renamed successfully.');
    } catch (renameError) {
      setDocumentActionError(formatApiError(renameError, 'The file could not be renamed.'));
    } finally {
      setDocumentActionLoading(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDocumentTarget || documentActionLoading) return;
    setDocumentActionLoading(true);
    setDocumentActionError('');
    try {
      await deleteReservationDocument(deleteDocumentTarget.id);
      setDetail((previous) => previous ? {
        ...previous,
        documents: (previous.documents || []).filter((doc) => Number(doc.id) !== Number(deleteDocumentTarget.id)),
      } : previous);
      setDeleteDocumentTarget(null);
      setSuccessMessage('File deleted successfully.');
    } catch (deleteErrorValue) {
      setDocumentActionError(formatApiError(deleteErrorValue, 'The file could not be deleted.'));
    } finally {
      setDocumentActionLoading(false);
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !viewRecord?.reservation_id || !uploadDocumentType) return;
    const formData = new FormData();
    formData.append('reservation_id', String(viewRecord.reservation_id));
    formData.append('document_type', uploadDocumentType);
    formData.append('document', file);
    setUploading(true);
    setDetailError('');
    try {
      await uploadReservationDocument(formData);
      setSuccessMessage('Document uploaded successfully.');
      await openRecord(viewRecord);
    } catch (uploadError) {
      setDetailError(formatApiError(uploadError, 'The document could not be uploaded.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <DashboardLayout contentClassName="!pt-0" onRecordsClick={openRoot}>
      <div className="sticky top-0 z-20 -mx-4 mb-3 flex flex-col gap-2 border-b border-[#e7dfd2] bg-white/95 px-4 py-2.5 backdrop-blur-sm md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <nav aria-label="Folder breadcrumb" className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold text-[#34495a]">
          <button type="button" className={`shrink-0 hover:text-[#a6813f] ${!selectedService ? 'text-[#1f3342]' : ''}`} onClick={openRoot}>Records</button>
          {selectedService && <><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#a9a49a]" /><button type="button" className={`shrink-0 hover:text-[#a6813f] ${!viewRecord && !folderTrail.length ? 'text-[#1f3342]' : ''}`} onClick={() => openService(selectedService)}>{selectedService}</button></>}
          {viewRecord && <><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#a9a49a]" /><button type="button" title={viewRecord.fullname} className={`max-w-[min(70vw,32rem)] truncate hover:text-[#a6813f] ${!folderTrail.length ? 'text-[#1f3342]' : ''}`} onClick={() => openRecord(viewRecord)}>{viewRecord.fullname}</button></>}
          {folderTrail.map((folder, index) => <span key={folder.id} className="inline-flex shrink-0 items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#a9a49a]" />{index === folderTrail.length - 1 ? <span aria-current="page" className="text-[#1f3342]">{folder.name}</span> : <button type="button" className="hover:text-[#a6813f]" onClick={() => { setFolderTrail((trail) => trail.slice(0, index + 1)); setSearchText(''); setPage(1); }}>{folder.name}</button>}</span>)}
        </nav>
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <input ref={folderFileInputRef} type="file" className="hidden" onChange={uploadManagerFile} />
          <button type="button" className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-[#b18a45] px-2.5 text-xs font-semibold text-white transition hover:bg-[#967338] disabled:opacity-60" onClick={() => folderFileInputRef.current?.click()} disabled={fileUploading}>
            <UploadCloud className="mr-1.5 h-3.5 w-3.5" />{fileUploading ? 'Uploading…' : 'Upload File'}
          </button>
          <button type="button" className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#b18a45] bg-white px-2.5 text-xs font-semibold text-[#8a6b34] transition hover:bg-[#fbf7ee]" onClick={() => { setFolderError(''); setNewFolderName(''); setCreateFolderOpen(true); }}>
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" />New Folder
          </button>
          {viewRecord && !viewRecord.is_unlinked && uploadOptions.length > 0 && <>
            <select aria-label="Document type" className="h-9 min-w-40 flex-1 rounded-md border border-[#e7dfd2] bg-white px-2.5 text-xs text-[#58616a] outline-none focus:border-[#b18a45] xl:flex-none" value={uploadDocumentType} onChange={(event) => setUploadDocumentType(event.target.value)}>
              {uploadOptions.map((option) => <option key={option.type} value={option.type}>{option.name}</option>)}
            </select>
            <input id="record-document-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={uploadFile} />
            <button type="button" className="inline-flex h-9 items-center justify-center rounded-md bg-[#b18a45] px-2.5 text-xs font-semibold text-white transition hover:bg-[#967338] disabled:opacity-60" onClick={() => document.getElementById('record-document-upload')?.click()} disabled={uploading || !uploadDocumentType}>
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" />{uploading ? 'Uploading…' : 'Upload Requirement'}
            </button>
          </>}
          <form onSubmit={handleSearch} className="relative min-w-[160px] flex-1 sm:w-48 sm:flex-none xl:w-60">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92999d]" />
            <input aria-label="Search files" className="h-9 w-full rounded-md border border-[#e7dfd2] bg-white pl-8 pr-2.5 text-xs text-[#1f3342] outline-none placeholder:text-[#92999d] focus:border-[#b18a45] focus:ring-2 focus:ring-[#d7b57a]/20" placeholder="Search files..." value={searchText} onChange={handleSearchChange} />
          </form>
        </div>
      </div>

      {successMessage && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{successMessage}</div>}
      {folderError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{folderError}</div>}

      <section className={viewRecord ? 'min-h-0' : 'overflow-hidden rounded-lg border border-[#e7dfd2] bg-white shadow-sm'}>
        {loading ? <div className="py-12"><LoadingSpinner /><p className="mt-2 text-center text-sm text-slate-500">Loading records...</p></div>
          : error ? <ErrorState message={error} onRetry={load} />
            : folderTrail.length ? <FolderContentTable rows={folderRows} loading={folderListLoading} emptyMessage="This folder is empty." onOpenFolder={(row) => row.customFolder ? openCustomFolder(row.customFolder) : row.record ? openRecord(row.record) : row.service ? openService(row.service) : null} onOpenFile={openManagerFile} onDeleteFile={removeManagerFile} onDeleteFolder={removeCustomFolder} onDeleteRecord={openDelete} />
            : viewRecord ? detailLoading ? <div className="py-12"><LoadingSpinner /><p className="mt-2 text-center text-sm text-slate-500">Loading record details...</p></div>
              : detailError && !detail ? <div className="p-6 text-center"><p className="mb-4 text-sm text-red-600">{detailError}</p><button type="button" className="btn-primary text-sm" onClick={() => openRecord(viewRecord)}>Try again</button></div>
                : detail ? <>
                  {detailError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{detailError}</p>}
                  <RecordDetailsContent
                    detail={detail}
                    searchQuery={documentSearch}
                    onDownload={downloadReservationFile}
                    onRename={openRenameDocument}
                    onDelete={(doc) => { setDocumentActionError(''); setDeleteDocumentTarget(doc); }}
                  />
                </> : <div className="p-6 text-center"><p className="mb-4 text-sm text-red-600">No record information was returned.</p><button type="button" className="btn-primary text-sm" onClick={() => openRecord(viewRecord)}>Try again</button></div>
              : <FolderContentTable rows={folderRows} loading={folderListLoading} emptyMessage={selectedService ? 'No official records or files in this folder.' : 'No folders or files match this search.'} onOpenFolder={(row) => row.customFolder ? openCustomFolder(row.customFolder) : row.record ? openRecord(row.record) : row.service ? openService(row.service) : null} onOpenFile={openManagerFile} onDeleteFile={removeManagerFile} onDeleteFolder={removeCustomFolder} onDeleteRecord={openDelete} />}
      </section>

      <Modal isOpen={createFolderOpen} onClose={() => !creatingFolder && setCreateFolderOpen(false)} title="Create New Folder" size="sm">
        <form onSubmit={createFolder}>
          <label htmlFor="record-new-folder-name" className="mb-1.5 block text-sm font-medium text-slate-700">Folder Name</label>
          <input id="record-new-folder-name" autoFocus required maxLength={100} value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} className="input-field" placeholder="Enter folder name..." />
          <p className="mt-2 text-xs text-slate-500">This folder will be created in the current Records location.</p>
          {folderError && <p className="mt-3 text-sm text-red-600" role="alert">{folderError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setCreateFolderOpen(false)} disabled={creatingFolder}>Cancel</button>
            <button type="submit" className="btn-primary text-sm" disabled={creatingFolder || !newFolderName.trim()}>{creatingFolder ? 'Creating…' : 'Create Folder'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={closeDelete} title="Delete Parishioner Record?" size="sm">
        {deleteTarget && <div>
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold text-[#0f2337]">{deleteTarget.fullname}</span>&apos;s official record? This removes only the selected reservation or archive record and its associated documents.</p>
          {deleteError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm font-semibold text-red-800">Unable to Delete Record</p><p className="mt-1 text-sm text-red-700">{deleteError}</p></div>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50" onClick={closeDelete} disabled={deleting}>Cancel</button><button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Record'}</button></div>
        </div>}
      </Modal>

      <Modal
        isOpen={!!renameDocumentTarget}
        onClose={() => !documentActionLoading && setRenameDocumentTarget(null)}
        title="Rename File"
        size="sm"
      >
        <form onSubmit={saveRenamedDocument}>
          <label htmlFor="record-document-rename" className="mb-1.5 block text-sm font-medium text-slate-700">File name</label>
          <input
            id="record-document-rename"
            autoFocus
            required
            maxLength={255}
            value={renameDocumentName}
            onChange={(event) => setRenameDocumentName(event.target.value)}
            className="input-field"
          />
          <p className="mt-2 text-xs text-slate-500">Keep the existing file extension.</p>
          {documentActionError && <p className="mt-3 text-sm text-red-600" role="alert">{documentActionError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setRenameDocumentTarget(null)} disabled={documentActionLoading}>Cancel</button>
            <button type="submit" className="btn-primary text-sm" disabled={documentActionLoading || !renameDocumentName.trim()}>{documentActionLoading ? 'Saving…' : 'Save name'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteDocumentTarget}
        onClose={() => !documentActionLoading && setDeleteDocumentTarget(null)}
        title="Delete File?"
        size="sm"
      >
        {deleteDocumentTarget && <div>
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-semibold text-[#0f2337]">{deleteDocumentTarget.original_filename || deleteDocumentTarget.document_name}</span>? This cannot be undone.</p>
          {documentActionError && <p className="mt-3 text-sm text-red-600" role="alert">{documentActionError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDeleteDocumentTarget(null)} disabled={documentActionLoading}>Cancel</button>
            <button type="button" className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" onClick={confirmDeleteDocument} disabled={documentActionLoading}>{documentActionLoading ? 'Deleting…' : 'Delete file'}</button>
          </div>
        </div>}
      </Modal>
    </DashboardLayout>
  );
}
