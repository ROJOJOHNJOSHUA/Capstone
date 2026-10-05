import { useState, useRef, useEffect } from 'react';
import ImagePreviewModal from './ImagePreviewModal';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function DocumentUpload({ 
  requirements = [], 
  onFilesChange, 
  initialFiles = {},
  existingDocuments = [],
  reservationId = null,
  onDocumentReplace = null,
}) {
  const [files, setFiles] = useState({});
  const [activeDropType, setActiveDropType] = useState(null);
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({});
  const [preview, setPreview] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    setFiles(initialFiles || {});
  }, [initialFiles]);

  const handleDocumentDrop = (docType, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropType(null);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles?.length) return;
    if (droppedFiles.length > 1) {
      setErrors((current) => ({
        ...current,
        [docType]: 'Drop one file at a time for this document.',
      }));
      return;
    }

    setErrors((current) => {
      const next = { ...current };
      delete next[docType];
      return next;
    });
    handleFiles(droppedFiles, docType);
  };

  const handleFileChange = (docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFiles([file], docType);
    e.target.value = '';
  };

  const handleFiles = (fileList, selectedDocType = null) => {
    const newFiles = { ...files };
    const newErrors = { ...errors };

    Array.from(fileList).forEach((file) => {
      let docType = selectedDocType || findDocumentType(file.name);

      if (!docType) {
        const unassigned = requirements.find(
          (req) => !newFiles[req.type] && !existingDocuments.some(
            (d) => d.document_type === req.type && d.status !== 'Rejected'
          )
        );
        if (unassigned) {
          docType = unassigned.type;
        }
      }
      
      if (!docType) {
        newErrors[file.name] = 'File does not match any required document type. Rename the file to include the document name, or upload one file at a time.';
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors[file.name] = 'Only JPG, PNG, and PDF files are allowed';
        return;
      }

      if (file.size > MAX_SIZE) {
        newErrors[file.name] = 'File size exceeds 5MB limit';
        return;
      }

      newFiles[docType] = file;
      delete newErrors[file.name];
      if (selectedDocType) delete newErrors[selectedDocType];

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            setErrors((current) => ({
              ...current,
              [docType]: `Could not create a preview for ${file.name}.`,
            }));
            return;
          }
          setPreviews((current) => ({ ...current, [docType]: reader.result }));
        };
        reader.onerror = () => {
          setErrors((current) => ({
            ...current,
            [docType]: `Could not read ${file.name} to create a preview.`,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[docType];
          return next;
        });
      }
    });

    setFiles(newFiles);
    setErrors(newErrors);
    onFilesChange?.(newFiles);
  };

  const findDocumentType = (filename) => {
    const lowerName = filename.toLowerCase();
    for (const req of requirements) {
      if (lowerName.includes(req.type.toLowerCase()) || 
          lowerName.includes(req.name.toLowerCase().replace(/\s+/g, '_'))) {
        return req.type;
      }
    }
    return null;
  };

  const removeFile = (docType) => {
    const newFiles = { ...files };
    const newPreviews = { ...previews };
    delete newFiles[docType];
    delete newPreviews[docType];
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesChange?.(newFiles);
  };

  const onButtonClick = (docType) => {
    fileInputRefs.current[docType]?.click();
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📁';
  };

  const getDocumentStatus = (docType) => {
    const existing = existingDocuments.find(d => d.document_type === docType);
    return existing?.status || 'missing';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-50 text-emerald-700';
      case 'Rejected': return 'bg-rose-50 text-rose-700';
      case 'Pending': return 'bg-amber-50 text-amber-800';
      default: return 'bg-[#f5f4f1] text-[#68645d]';
    }
  };

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:rounded-[24px] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:tracking-[0.18em]">Documents</h3>
        <span className="rounded-full bg-[#f5ead0] px-2.5 py-1 text-[10px] font-medium text-[#775b25]">Required</span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {requirements.length > 0 ? (
          <>
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              <p className="font-medium mb-1">Upload errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([name, error]) => (
                <li key={name} className="break-words">{requirements.find((req) => req.type === name)?.name || name}: {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {requirements.map((req) => {
              const file = files[req.type];
              const existing = existingDocuments.find(d => d.document_type === req.type);
              const status = getDocumentStatus(req.type);
              const isUploading = uploading[req.type];
              const statusLabel = file ? 'Ready to upload' : status === 'missing' ? 'Not uploaded' : status;

              return (
                <div
                  key={req.type}
                  className={`min-w-0 rounded-xl border p-3 shadow-sm sm:rounded-2xl sm:p-5 ${
                    status === 'Verified' && !file ? 'border-emerald-200 bg-emerald-50/60' :
                    status === 'Rejected' && !file ? 'border-rose-200 bg-rose-50/60' :
                    file ? 'border-[#d8c69e] bg-[#fffcf5]' :
                    'border-[#e8e2d7] bg-white'
                  }`}
                >
                  <input
                    ref={(element) => {
                      fileInputRefs.current[req.type] = element;
                    }}
                    type="file"
                    onChange={(e) => handleFileChange(req.type, e)}
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
                      <button
                        type="button"
                        onClick={() => onButtonClick(req.type)}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveDropType(req.type);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'copy';
                          setActiveDropType(req.type);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!e.currentTarget.contains(e.relatedTarget)) setActiveDropType(null);
                        }}
                        onDrop={(e) => handleDocumentDrop(req.type, e)}
                        aria-label={`Choose or drop a file for ${req.name}`}
                        title={`Click or drop a file for ${req.name}`}
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-1.5 shadow-sm transition sm:h-16 sm:w-16 sm:rounded-xl ${
                          activeDropType === req.type
                            ? 'border-[#b18a45] bg-[#faf3e3] ring-2 ring-[#b18a45]/30'
                            : 'border-[#ece5d9] hover:border-[#c5ad7b] hover:bg-[#fdfbf7]'
                        }`}
                      >
                        {activeDropType === req.type ? (
                          <span className="text-center text-[10px] font-semibold leading-tight text-[#6d552b]">Drop<br />file</span>
                        ) : file && previews[req.type] ? (
                          <img
                            src={previews[req.type]}
                            alt={`Preview of ${file.name}`}
                            className="h-full w-full rounded-lg object-contain"
                          />
                        ) : (
                          <span className="text-2xl" aria-hidden="true">
                            {file ? getFileIcon(file.type) : getFileIcon('application/pdf')}
                          </span>
                        )}
                      </button>
                      <div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
                        <p className="break-words text-sm font-semibold leading-5 text-[#302b24]">{req.name}</p>
                        <p className="mt-0.5 text-xs text-[#817663]">
                          {req.required ? 'Required' : 'Optional'}
                        </p>
                        {file && (
                          <p className="mt-1 break-all text-xs leading-4 text-[#635a4e]">{file.name}</p>
                        )}
                        {existing && !file && (
                          <p className="mt-1 text-xs text-[#817663]">
                            Uploaded {new Date(existing.uploaded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                      {isUploading ? (
                        <span className="w-full text-sm font-medium text-[#6d552b] sm:w-auto">Uploading...</span>
                      ) : (
                        <>
                          <div
                            role="group"
                            aria-label={`${req.name} file selection and upload status`}
                            className="inline-flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-[#e3d9c7] bg-white shadow-sm sm:flex-none"
                          >
                            <button
                              type="button"
                              onClick={() => onButtonClick(req.type)}
                              className="inline-flex min-h-10 shrink-0 items-center whitespace-nowrap bg-[#f5e8c9] px-2.5 py-2 text-[11px] font-semibold text-[#6d552b] transition hover:bg-[#eddbb3] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b18a45] sm:px-3.5 sm:text-xs"
                            >
                              {file ? 'Change File' : 'Select File'}
                            </button>
                            <span className={`inline-flex min-h-10 min-w-0 flex-1 items-center justify-center break-words border-l border-[#e3d9c7] px-2 py-2 text-center text-[10px] font-medium leading-4 sm:flex-none sm:whitespace-nowrap sm:px-3 sm:text-[11px] ${
                              file
                                ? 'bg-[#f8f4e9] text-[#745d32]'
                                : getStatusColor(status)
                            }`}>
                              {statusLabel}
                            </span>
                          </div>
                          {file && (
                            <button
                              type="button"
                              onClick={() => removeFile(req.type)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Remove ${req.name}`}
                              title="Remove file"
                            >
                              ✕
                            </button>
                          )}
                          {existing && status === 'Rejected' && onDocumentReplace && (
                            <button
                              type="button"
                              onClick={() => onDocumentReplace(req.type)}
                              className="min-h-10 rounded-lg px-2 py-2 text-xs font-semibold text-[#8b682d] underline underline-offset-2 hover:text-[#684b1e]"
                            >
                              Replace
                            </button>
                          )}
                          {previews[req.type] && (
                            <button
                              type="button"
                              onClick={() => setPreview({
                                src: previews[req.type],
                                alt: file.name,
                                type: file.type,
                              })}
                              className="min-h-10 rounded-lg px-2 py-2 text-xs font-semibold text-[#8b682d] underline underline-offset-2 hover:text-[#684b1e]"
                            >
                              Preview
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {existing && existing.remarks && status === 'Rejected' && (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-white/70 px-3 py-2 text-xs italic text-rose-700">
                      Remarks: "{existing.remarks}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No document requirements for this service.</p>
        )}
      </div>
      <ImagePreviewModal
        isOpen={!!preview}
        src={preview?.src}
        alt={preview?.alt}
        type={preview?.type}
        title={preview?.type === 'application/pdf' ? preview.alt : 'Image Preview'}
        onClose={() => setPreview(null)}
      />
    </section>
  );
}
