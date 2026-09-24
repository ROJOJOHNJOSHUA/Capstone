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
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({});
  const [preview, setPreview] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    setFiles(initialFiles || {});
  }, [initialFiles]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
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

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => ({ ...prev, [docType]: e.target.result }));
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
      case 'Verified': return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {requirements.length > 0 ? (
        <>
          <div
            className={`rounded-xl border-2 border-dashed p-3 text-center transition-colors sm:p-6 ${
              dragActive ? 'border-parish-blue bg-parish-blue-light' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl">📤</div>
              <p className="text-sm font-medium text-gray-700">
                Drag and drop files here
              </p>
              <p className="text-[10px] text-gray-500 sm:text-xs">
                Accepted: JPG, PNG, PDF (max 5MB each)
              </p>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              <p className="font-medium mb-1">Upload errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([name, error]) => (
                  <li key={name}>{name}: {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 sm:space-y-3">
            {requirements.map((req) => {
              const file = files[req.type];
              const existing = existingDocuments.find(d => d.document_type === req.type);
              const status = getDocumentStatus(req.type);
              const isUploading = uploading[req.type];

              return (
                <div
                  key={req.type}
                  className={`rounded-xl border p-2.5 sm:p-3 ${
                    status === 'Verified' ? 'border-green-300 bg-green-50' :
                    status === 'Rejected' ? 'border-red-300 bg-red-50' :
                    file ? 'border-blue-300 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-2xl shadow-sm sm:h-12 sm:w-12">
                        {file ? getFileIcon(file.type) : getFileIcon('application/pdf')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">{req.name}</p>
                        <p className="text-[10px] text-gray-500 sm:text-xs">
                          {req.required ? 'Required' : 'Optional'}
                        </p>
                        {file && (
                          <p className="mt-1 truncate text-[10px] text-gray-600 sm:text-xs" title={file.name}>{file.name}</p>
                        )}
                        {existing && !file && (
                          <p className="mt-1 text-[10px] text-gray-600 sm:text-xs">
                            Uploaded: {new Date(existing.uploaded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                      {isUploading ? (
                        <span className="text-xs text-blue-600">Uploading...</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onButtonClick(req.type)}
                            className="btn-primary w-full min-h-10 px-3 py-2 text-[11px] sm:w-auto sm:text-xs"
                          >
                            {file ? 'Change File' : 'Select File'}
                          </button>
                          <span className={`self-start rounded border px-2 py-1 text-[10px] sm:text-xs ${getStatusColor(status)}`}>
                            {status === 'missing' ? 'Not uploaded' : status}
                          </span>
                          {file && (
                            <button
                              type="button"
                              onClick={() => removeFile(req.type)}
                              className="text-sm text-red-600 hover:text-red-800 sm:self-auto"
                              aria-label="Remove file"
                            >
                              ✕
                            </button>
                          )}
                          {existing && status === 'Rejected' && onDocumentReplace && (
                            <button
                              type="button"
                              onClick={() => onDocumentReplace(req.type)}
                              className="text-[11px] text-blue-600 underline sm:text-xs"
                            >
                              Replace
                            </button>
                          )}
                          {previews[req.type] && (
                            <button
                              type="button"
                              onClick={() => setPreview({ src: previews[req.type], alt: file.name })}
                              className="text-[11px] text-blue-600 underline sm:text-xs"
                            >
                              Preview
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {file && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-blue-100 bg-white p-2">
                      {previews[req.type] ? (
                        <img
                          src={previews[req.type]}
                          alt={`Preview of ${file.name}`}
                          className="h-12 w-12 rounded object-cover sm:h-14 sm:w-14"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xl sm:h-14 sm:w-14 sm:text-2xl">
                          {getFileIcon(file.type)}
                        </span>
                      )}
                      <p className="min-w-0 flex-1 truncate text-[10px] text-gray-700 sm:text-xs" title={file.name}>
                        ✓ {file.name}
                      </p>
                    </div>
                  )}
                  {existing && existing.remarks && status === 'Rejected' && (
                    <p className="mt-2 text-[10px] italic text-red-600 sm:text-xs">
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
      <ImagePreviewModal
        isOpen={!!preview}
        src={preview?.src}
        alt={preview?.alt}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
