import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/cards/StatusBadge';
import LoadingSpinner from '../components/forms/LoadingSpinner';
import Modal from '../components/forms/Modal';
import ImagePreviewModal from '../components/forms/ImagePreviewModal';
import DocumentUpload from '../components/forms/DocumentUpload';
import FuneralReservationForm from '../components/forms/FuneralReservationForm';
import PrivateMassReservationForm from '../components/forms/PrivateMassReservationForm';
import {
  SERVICE_TYPES,
  SERVICE_LABELS,
  SERVICE_SCHEDULE,
  SERVICE_REQUIREMENTS,
  PARISH_LOCATION,
} from '../utils/constants';
import {
  getReservations,
  createReservation,
  updateReservation,
  checkAvailability,
  checkMonthlyAvailability,
  getDocumentRequirements,
  uploadReservationDocument,
  getReservationDocuments,
  fetchReservationDocument,
} from '../services/api';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RESERVATIONS_PER_PAGE = 10;

const SERVICE_STEPS = [
  { id: 'service', label: 'Service' },
  { id: 'details', label: 'Personal Info' },
  { id: 'schedule', label: 'Date & Time' },
  { id: 'documents', label: 'Requirements' },
  { id: 'review', label: 'Review' },
];

const BAPTISM_STEPS = [
  { id: 'service', label: 'Select Service' },
  { id: 'child', label: 'Child Information' },
  { id: 'parents', label: 'Parent / Sponsor' },
  { id: 'schedule', label: 'Date & Time' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'review', label: 'Review & Submit' },
];

const MARRIAGE_STEPS = [
  { id: 'service', label: 'Service Type' },
  { id: 'personal', label: 'Personal Information' },
  { id: 'couple', label: 'Bride & Groom' },
  { id: 'schedule', label: 'Date & Time' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'review', label: 'Review' },
];

const SERVICE_DETAIL_FIELDS = {
  Marriage: [
    { key: 'bride_full_name', label: "Full Name" },
    { key: 'bride_age', label: "Age" },
    { key: 'bride_birthdate', label: "Date of Birth" },
    { key: 'bride_birth_place', label: "Place of Birth" },
    { key: 'bride_address', label: "Address" },
    { key: 'bride_contact_number', label: "Contact" },
    { key: 'bride_father_name', label: "Father's Full Name" },
    { key: 'bride_mother_name', label: "Mother's Full Name" },
    { key: 'groom_full_name', label: "Full Name" },
    { key: 'groom_age', label: "Age" },
    { key: 'groom_birthdate', label: "Date of Birth" },
    { key: 'groom_birth_place', label: "Place of Birth" },
    { key: 'groom_address', label: "Address" },
    { key: 'groom_contact_number', label: "Contact" },
    { key: 'groom_father_name', label: "Father's Full Name" },
    { key: 'groom_mother_name', label: "Mother's Full Name" },
  ],
  Funeral: [
    { key: 'deceased_name', label: 'Deceased Name' },
    { key: 'family_contact', label: 'Family Contact Person' },
    { key: 'relationship', label: 'Relationship to Deceased' },
    { key: 'funeral_date', label: 'Preferred Funeral Date' },
    { key: 'service_details', label: 'Service Details / Notes' },
  ],
  Baptism: [
    { key: 'child_first_name', label: 'First Name' },
    { key: 'child_middle_name', label: 'Middle Name' },
    { key: 'child_last_name', label: 'Last Name' },
    { key: 'child_birthdate', label: 'Date of Birth' },
    { key: 'child_birth_place', label: 'Place of Birth' },
    { key: 'child_sex', label: 'Sex' },
    { key: 'child_address_street', label: 'House / Street' },
    { key: 'child_address_barangay', label: 'Barangay' },
    { key: 'child_address_municipality', label: 'Municipality' },
    { key: 'child_address_province', label: 'Province' },
    { key: 'father_full_name', label: "Father's Full Name" },
    { key: 'mother_full_name', label: "Mother's Full Name" },
    { key: 'requester_contact_number', label: 'Contact Number' },
    { key: 'sponsor_name', label: 'Ninong / Ninang Name' },
    { key: 'sponsor_contact_number', label: 'Ninong / Ninang Contact Number' },
  ],
  'Mass Intention': [
    { key: 'intention_name', label: 'Intention Name / Requested For' },
    { key: 'prayer_intention', label: 'Special Request / Prayer Intention' },
  ],
  'Private Mass': [
    { key: 'event_name', label: 'Event / Occasion Name' },
    { key: 'attendees_count', label: 'Expected Attendees' },
    { key: 'preferred_priest', label: 'Preferred Priest (Optional)' },
    { key: 'purpose_note', label: 'Purpose of the Mass' },
  ],
};

function getDefaultServiceDetails(serviceType) {
  const fields = SERVICE_DETAIL_FIELDS[serviceType] || [];
  return Object.fromEntries(fields.map((field) => [field.key, '']));
}

function buildServiceRequirements(serviceDetails, notes) {
  const lines = [];
  Object.entries(serviceDetails || {}).forEach(([key, value]) => {
    const field = Object.values(SERVICE_DETAIL_FIELDS)
      .flat()
      .find((item) => item.key === key);
    if (value && value.toString().trim()) {
      lines.push(`${field?.label || key}: ${value}`);
    }
  });

  if (notes && notes.trim()) {
    lines.push(`Additional Notes: ${notes.trim()}`);
  }

  return lines.join('\n');
}

function toIsoMonth(dateValue) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function toIsoDate(dateValue) {
  const y = dateValue.getFullYear();
  const m = String(dateValue.getMonth() + 1).padStart(2, '0');
  const d = String(dateValue.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(monthIso) {
  const [year, month] = monthIso.split('-').map(Number);
  const dateValue = new Date(year, month - 1, 1);
  return dateValue.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatSlotTime(time) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function decodeDisplayText(value) {
  const text = String(value ?? '');
  if (typeof document === 'undefined' || !text.includes('&')) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function parseReservationDetails(value) {
  const fields = [];
  const notes = [];
  const labelAliases = {
    fullname: 'Full Name',
    email: 'Email Address',
    phone: 'Contact Number',
    address: 'Address',
  };

  decodeDisplayText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex < 1) {
        notes.push(line);
        return;
      }

      const rawLabel = line.slice(0, separatorIndex).trim();
      const fieldValue = line.slice(separatorIndex + 1).trim();
      if (!rawLabel || !fieldValue) {
        notes.push(line);
        return;
      }

      if (rawLabel.toLowerCase() === 'additional notes') {
        notes.push(fieldValue);
        return;
      }

      const label = labelAliases[rawLabel.toLowerCase()] || rawLabel;
      fields.push({ label, value: fieldValue });
    });

  return { fields, notes };
}

export default function Reservation() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingReservationId, setCancellingReservationId] = useState(null);
  const [reservationPage, setReservationPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    service_type: 'Marriage',
    reservation_date: '',
    reservation_time: '',
    requirements: '',
    serviceDetails: getDefaultServiceDetails('Marriage'),
    personalDetails: {
      fullname: user?.fullname || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });
  const isMarriageFlow = form.service_type === 'Marriage';
  const isBaptismFlow = form.service_type === 'Baptism';
  const activeSteps = isMarriageFlow ? MARRIAGE_STEPS : isBaptismFlow ? BAPTISM_STEPS : SERVICE_STEPS;
  const [slotItems, setSlotItems] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(toIsoMonth(new Date()));
  const [dateStatuses, setDateStatuses] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  
  // Document-related state
  const [docRequirements, setDocRequirements] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [reservationDocuments, setReservationDocuments] = useState({});
  const [loadingDocs, setLoadingDocs] = useState({});
  const [documentLoadErrors, setDocumentLoadErrors] = useState({});
  const [documentPreview, setDocumentPreview] = useState(null);
  const documentPreviewUrl = useRef(null);
  const documentPreviewRequest = useRef(0);
  const fetchedDocIds = useRef(new Set());
  const documentRequests = useRef(new Map());
  const submitInProgress = useRef(false);
  const reservationRefreshInFlight = useRef(false);
  const cancelReservationInProgress = useRef(false);

  const [searchParams] = useSearchParams();
  const formRef = useRef(null);

  useEffect(() => () => {
    if (documentPreviewUrl.current) {
      window.URL.revokeObjectURL(documentPreviewUrl.current);
    }
  }, []);

  const closeDocumentPreview = () => {
    documentPreviewRequest.current += 1;
    if (documentPreviewUrl.current) {
      window.URL.revokeObjectURL(documentPreviewUrl.current);
      documentPreviewUrl.current = null;
    }
    setDocumentPreview(null);
  };

  const previewReservationDocument = async (doc) => {
    const requestId = documentPreviewRequest.current + 1;
    documentPreviewRequest.current = requestId;
    setDocumentPreview({ doc, loading: true });

    try {
      const { blob, contentType } = await fetchReservationDocument(doc.id, { disposition: 'inline' });
      if (documentPreviewRequest.current !== requestId) return;

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(contentType)) {
        throw new Error('Preview is only available for JPG, PNG, and PDF documents.');
      }

      if (documentPreviewUrl.current) {
        window.URL.revokeObjectURL(documentPreviewUrl.current);
      }
      const url = window.URL.createObjectURL(blob);
      documentPreviewUrl.current = url;
      setDocumentPreview({ doc, loading: false, url, contentType });
    } catch (previewError) {
      if (documentPreviewRequest.current === requestId) {
        setDocumentPreview({
          doc,
          loading: false,
          error: previewError.message || 'Could not load document preview.',
        });
      }
    }
  };

  const refreshMonthlyStatuses = (serviceType, monthIso) =>
    checkMonthlyAvailability(monthIso, serviceType)
      .then((r) => setDateStatuses(r.data.dates || {}))
      .catch(() => setDateStatuses({}));

  const loadReservationDocuments = (reservationId) => {
    const requestKey = String(reservationId);
    const existingRequest = documentRequests.current.get(requestKey);
    if (existingRequest) return existingRequest;

    setLoadingDocs((current) => ({ ...current, [reservationId]: true }));
    setDocumentLoadErrors((current) => {
      const next = { ...current };
      delete next[reservationId];
      return next;
    });

    const request = getReservationDocuments(reservationId)
      .then((response) => {
        setReservationDocuments((current) => ({
          ...current,
          [reservationId]: response.data.documents || [],
        }));
        fetchedDocIds.current.add(reservationId);
      })
      .catch((loadError) => {
        setDocumentLoadErrors((current) => ({
          ...current,
          [reservationId]: loadError.message || 'Could not load uploaded documents.',
        }));
        throw loadError;
      })
      .finally(() => {
        setLoadingDocs((current) => ({ ...current, [reservationId]: false }));
        documentRequests.current.delete(requestKey);
      });

    documentRequests.current.set(requestKey, request);
    return request;
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true);
      setError('');
      setMsg('');
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [searchParams]);

  const load = (silent = false) => {
    if (reservationRefreshInFlight.current) return;
    reservationRefreshInFlight.current = true;
    if (!silent) {
      setLoading(true);
      setReservationPage(1);
    }
    getReservations()
      .then((r) => {
        const updatedReservations = r.data.reservations || [];
        setReservations(updatedReservations);
        setViewing((current) => current
          ? updatedReservations.find((reservation) => reservation.id === current.id) || current
          : null);
      })
      .catch((loadError) => {
        console.error('Failed to refresh reservations:', loadError);
        if (!silent) setError('Failed to load reservations. Please refresh the page.');
      })
      .finally(() => {
        reservationRefreshInFlight.current = false;
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load(true);
    };
    const interval = window.setInterval(refreshWhenVisible, 10000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, []);

  // Load document requirements when service type changes
  useEffect(() => {
    if (form.service_type) {
      getDocumentRequirements().then((r) => {
        setDocRequirements(r.data[form.service_type] || []);
      });
    }
  }, [form.service_type]);

  // Load documents for existing reservations (once per reservation)
  useEffect(() => {
    reservations.forEach((reservation) => {
      if (fetchedDocIds.current.has(reservation.id)) return;
      loadReservationDocuments(reservation.id).catch(() => {});
    });
  }, [reservations]);

  useEffect(() => {
    if (form.reservation_date && form.service_type) {
      checkAvailability(form.reservation_date, form.service_type).then((r) => {
        const available = r.data.available || [];
        const slotList = r.data.slots || [];
        setSlotItems(slotList);

        setDateStatuses((prev) => {
          const totalSlots = slotList.length;
          const availableCount = available.length;
          let status = prev[form.reservation_date]?.status;
          if (totalSlots > 0) {
            status = availableCount === 0 ? 'full' : 'available';
          }
          if (!status) return prev;
          return {
            ...prev,
            [form.reservation_date]: {
              ...(prev[form.reservation_date] || {}),
              status,
              available_count: availableCount,
              total_slots: totalSlots,
            },
          };
        });
      });
    } else {
      setSlotItems([]);
    }
  }, [form.reservation_date, form.service_type]);

  useEffect(() => {
    if (!form.service_type || !calendarMonth) {
      setDateStatuses({});
      return;
    }
    refreshMonthlyStatuses(form.service_type, calendarMonth);
  }, [form.service_type, calendarMonth]);

  const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const minDate = (() => {
    if (form.service_type !== 'Private Mass') return todayIso;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIsoDate(d);
  })();

  const monthDate = (() => {
    const [year, month] = calendarMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  })();

  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstWeekday = monthDate.getDay();
  const dateCells = Array.from({ length: firstWeekday + daysInMonth }, (_, idx) => {
    if (idx < firstWeekday) return null;
    const day = idx - firstWeekday + 1;
    return toIsoDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  });

  const handleServiceChange = (serviceType) => {
    const nextDetails = getDefaultServiceDetails(serviceType);
    setForm({
      ...form,
      service_type: serviceType,
      reservation_date: '',
      reservation_time: '',
      serviceDetails: nextDetails,
      personalDetails: form.personalDetails,
    });
    setCurrentStep(0);
    setCalendarMonth(toIsoMonth(new Date()));
  };

  const handleDateSelect = (iso) => {
    setForm({ ...form, reservation_date: iso, reservation_time: '' });
    if (iso.slice(0, 7) !== calendarMonth) {
      setCalendarMonth(iso.slice(0, 7));
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex < 0 || stepIndex > currentStep) return;
    setCurrentStep(stepIndex);
  };

  const getRequiredServiceDetails = () => SERVICE_DETAIL_FIELDS[form.service_type] || [];

  const marriagePersonalFields = [
    ['fullname', 'Full Name', 'text'],
    ['email', 'Email Address', 'email'],
    ['phone', 'Contact Number', 'tel'],
    ['address', 'Address', 'text'],
  ];
  const marriageCoupleFields = getRequiredServiceDetails();
  const getMarriageAgeValidationErrors = () => {
    const errors = {};
    const brideAge = Number(form.serviceDetails?.bride_age ?? '');
    const groomAge = Number(form.serviceDetails?.groom_age ?? '');

    if (!Number.isInteger(brideAge) || brideAge < 18 || brideAge > 120) {
      errors.bride_age = 'Bride age must be at least 18 years old.';
    }

    if (!Number.isInteger(groomAge) || groomAge < 18 || groomAge > 120) {
      errors.groom_age = 'Groom age must be at least 18 years old.';
    }

    return errors;
  };
  const canAdvanceMarriagePersonal = () => marriagePersonalFields.every(([key]) => String(form.personalDetails?.[key] || '').trim());
  const canAdvanceMarriageCouple = () => {
    const ageErrors = getMarriageAgeValidationErrors();
    return marriageCoupleFields.every((field) => String(form.serviceDetails[field.key] || '').trim()) && Object.keys(ageErrors).length === 0;
  };

  const canAdvanceFromService = () => Boolean(form.service_type);
  const canAdvanceFromDetails = (stepToValidate = currentStep) => {
    const allFields = getRequiredServiceDetails();
    const fields = isBaptismFlow
      ? stepToValidate === 1 ? allFields.slice(0, 10) : allFields.slice(10)
      : allFields;
    return fields.length === 0 || fields.every((field) => String(form.serviceDetails[field.key] || '').trim());
  };
  const canAdvanceFromSchedule = () => Boolean(
    form.reservation_date &&
    form.reservation_time &&
    slotItems.some((slot) => slot.time === form.reservation_time && slot.status === 'available')
  );
  const missingRequiredDocuments = () => docRequirements
    .filter((document) => document.required && !uploadedFiles[document.type]);

  const handleNextStep = () => {
    setError('');
    if (currentStep === 0 && !canAdvanceFromService()) {
      setError('Please choose a service type to continue.');
      return;
    }
    if (isMarriageFlow && currentStep === 1 && !canAdvanceMarriagePersonal()) {
      setError('Please complete all personal information fields before continuing.');
      return;
    }
    if (isMarriageFlow && currentStep === 2) {
      const ageErrors = getMarriageAgeValidationErrors();
      if (!canAdvanceMarriageCouple()) {
        setError(Object.values(ageErrors)[0] || 'Please complete all bride and groom information fields before continuing.');
        return;
      }
    }
    if (isMarriageFlow && currentStep === 3 && !canAdvanceFromSchedule()) {
      setError('Please choose an available date and time slot.');
      return;
    }
    if (isMarriageFlow && currentStep === 4) {
      const missingRequired = missingRequiredDocuments();
      if (missingRequired.length > 0) {
        setError(`Please upload all required documents: ${missingRequired.map((d) => d.name).join(', ')}`);
        return;
      }
    }
    if (!isMarriageFlow && currentStep === 1 && !canAdvanceFromDetails()) {
      const message = isBaptismFlow
        ? 'Please complete all child information fields before continuing.'
        : 'Please complete all personal information fields before continuing.';
      setError(message);
      return;
    }
    if (currentStep === 2 && isBaptismFlow && !canAdvanceFromDetails()) {
      setError('Please complete all parent and sponsor information fields before continuing.');
      return;
    }
    if (!isMarriageFlow && (isBaptismFlow ? currentStep === 3 : currentStep === 2) && !canAdvanceFromSchedule()) {
      setError('Please choose an available date and time slot.');
      return;
    }
    if (!isMarriageFlow && (isBaptismFlow ? currentStep === 4 : currentStep === 3)) {
      const missingRequired = missingRequiredDocuments();
      if (missingRequired.length > 0) {
        setError(`Please upload all required documents: ${missingRequired.map((d) => d.name).join(', ')}`);
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length - 1));
  };

  const handleBackStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== activeSteps.length - 1) return;
    if (submitInProgress.current) return;
    setError('');
    setMsg('');
    let reservationDate = form.reservation_date;
    let reservationTime = form.reservation_time;
    const missingStepDocuments = missingRequiredDocuments();
    if (isMarriageFlow) {
      const ageErrors = getMarriageAgeValidationErrors();
      if (!canAdvanceMarriagePersonal() || !canAdvanceMarriageCouple() || !canAdvanceFromSchedule() || missingStepDocuments.length > 0) {
        setError(missingStepDocuments.length > 0
          ? `Please upload all required documents: ${missingStepDocuments.map((d) => d.name).join(', ')}`
          : Object.values(ageErrors)[0] || 'Please complete all required Marriage information before submitting.');
        return;
      }
    }
    if (!isMarriageFlow && (!canAdvanceFromDetails(1) || (isBaptismFlow && !canAdvanceFromDetails(2)) || !canAdvanceFromSchedule()) || missingStepDocuments.length > 0) {
      setError(missingStepDocuments.length > 0
        ? `Please upload all required documents: ${missingStepDocuments.map((d) => d.name).join(', ')}`
        : 'Please complete all required fields and select an available date and time slot.');
      return;
    }
    if (!isMarriageFlow && !form.reservation_time) {
      setError('Please select an available time slot.');
      return;
    }
    
    // Check if required documents are uploaded
    const requiredDocs = docRequirements.filter(d => d.required);
    const missingRequired = requiredDocs.filter(d => !uploadedFiles[d.type]);
    if (missingRequired.length > 0) {
      setError(`Please upload all required documents: ${missingRequired.map(d => d.name).join(', ')}`);
      return;
    }

    submitInProgress.current = true;
    try {
      setUploadingDocs(true);
      const submittedDetails = isMarriageFlow
        ? { ...form.personalDetails, ...form.serviceDetails }
        : form.serviceDetails;
      const mergedRequirements = buildServiceRequirements(submittedDetails, form.requirements);
      let payload = {
        ...form,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        serviceDetails: submittedDetails,
        requirements: mergedRequirements,
      };
      const uploadedDocEntries = Object.entries(uploadedFiles);
      const hasInlineUploadFiles = uploadedDocEntries.length > 0;

      if (form.service_type === 'Mass Intention' || hasInlineUploadFiles) {
        payload = new FormData();
        payload.append('service_type', form.service_type);
        payload.append('reservation_date', form.reservation_date);
        payload.append('reservation_time', form.reservation_time);
        payload.append('requirements', mergedRequirements);
        payload.append('serviceDetails', JSON.stringify(submittedDetails));

        if (form.service_type === 'Mass Intention') {
          payload.append('intention_name', form.serviceDetails.intention_name);
          payload.append('prayer_intention', form.serviceDetails.prayer_intention);
          payload.append('payment_receipt', uploadedFiles.payment_receipt);
        }

        if (hasInlineUploadFiles) {
          uploadedDocEntries.forEach(([docType, file]) => {
            if (!file) return;
            payload.append(docType, file, file.name);
          });
        }
      }

      const response = await createReservation(payload);
      const reservationId = response.data.id;

      const uploadPromises = (form.service_type === 'Mass Intention' || hasInlineUploadFiles) ? [] : Object.entries(uploadedFiles).map(([docType, file]) => {
        const formData = new FormData();
        formData.append('reservation_id', reservationId);
        formData.append('document_type', docType);
        formData.append('document', file);
        return uploadReservationDocument(formData);
      });
      
      try {
        await Promise.all(uploadPromises);
        setMsg('Reservation submitted successfully with documents!');
      } catch (uploadErr) {
        setError(
          `Reservation submitted, but some documents failed to upload: ${uploadErr.message || 'Unknown error'}. ` +
          'Please upload missing documents from your reservation list below.'
        );
      }
      
      await refreshMonthlyStatuses(form.service_type, calendarMonth);
      setShowForm(false);
      setForm({
        service_type: 'Marriage',
        reservation_date: '',
        reservation_time: '',
        requirements: '',
        serviceDetails: getDefaultServiceDetails('Marriage'),
        personalDetails: {
          fullname: user?.fullname || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || '',
        },
      });
      setUploadedFiles({});
      fetchedDocIds.current.add(reservationId);
      try {
        await loadReservationDocuments(reservationId);
      } catch {
        setError('Reservation submitted, but its uploaded documents could not be loaded. Reopen the reservation details to try again.');
      }
      load();
    } catch (err) {
      setError(err.message || 'Failed to submit reservation');
    } finally {
      setUploadingDocs(false);
      submitInProgress.current = false;
    }
  };

  const reloadReservationDocuments = async (reservationId) => {
    const res = await getReservationDocuments(reservationId);
    setReservationDocuments((prev) => ({
      ...prev,
      [reservationId]: res.data.documents || [],
    }));
  };

  const handleDocumentReplace = (reservationId, docType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setError('');
      setMsg('');

      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        alert('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('reservation_id', reservationId);
        formData.append('document_type', docType);
        formData.append('document', file);
        await uploadReservationDocument(formData);
        await reloadReservationDocuments(reservationId);
        setMsg('Document replaced successfully. It will be reviewed by the parish office.');
      } catch (err) {
        setError('Failed to replace document: ' + (err.message || 'Unknown error'));
        try {
          await reloadReservationDocuments(reservationId);
        } catch {
          // Keep the replace error visible if refresh also fails.
        }
      }
    };
    input.click();
  };

  const handleCancelReservation = async (reservation) => {
    if (!['Pending', 'Under Review'].includes(reservation.status) || cancelReservationInProgress.current) return;
    const serviceLabel = SERVICE_LABELS[reservation.service_type] || reservation.service_type;
    if (!window.confirm(`Cancel your ${serviceLabel} reservation for ${reservation.reservation_date}?`)) return;

    cancelReservationInProgress.current = true;
    setCancellingReservationId(reservation.id);
    setError('');
    setMsg('');
    try {
      await updateReservation({ id: reservation.id, status: 'Cancelled' });
      setReservations((current) => current.map((item) =>
        item.id === reservation.id ? { ...item, status: 'Cancelled' } : item
      ));
      setViewing((current) => current?.id === reservation.id
        ? { ...current, status: 'Cancelled' }
        : current);
      setMsg('Reservation cancelled successfully.');
      load(true);
    } catch (cancelError) {
      setError(cancelError.message || 'Failed to cancel reservation.');
    } finally {
      cancelReservationInProgress.current = false;
      setCancellingReservationId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const totalReservations = reservations.length;
  const reservationPageCount = Math.max(1, Math.ceil(totalReservations / RESERVATIONS_PER_PAGE));
  const currentReservationPage = Math.min(reservationPage, reservationPageCount);
  const visibleReservations = reservations.slice(
    (currentReservationPage - 1) * RESERVATIONS_PER_PAGE,
    currentReservationPage * RESERVATIONS_PER_PAGE
  );

  return (
    <DashboardLayout>
      <div
        onClickCapture={() => {
          if (msg) setMsg('');
          if (error) setError('');
        }}
      >
      {msg && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{msg}</div>}

      {showForm && (
        form.service_type === 'Funeral' ? (
          <FuneralReservationForm
            user={user}
            onClose={() => setShowForm(false)}
            onSubmitted={load}
            onServiceChange={handleServiceChange}
          />
        ) : form.service_type === 'Private Mass' ? (
          <PrivateMassReservationForm
            user={user}
            onClose={() => setShowForm(false)}
            onSubmitted={load}
            onServiceChange={handleServiceChange}
          />
        ) : <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="reservation-request-form mb-6 overflow-hidden rounded-[30px] border border-[#e8dfd0] bg-white shadow-[0_22px_45px_rgba(15,31,45,0.08)]">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d7b57a]">New request</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#0f2337]">Reservation Request</h2>
              </div>
              <div className="rounded-full border border-[#e8dfd0] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {PARISH_LOCATION.name}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  disabled={index > currentStep}
                  onClick={() => goToStep(index)}
                  className={`min-w-[120px] rounded-xl border px-3 py-2 text-left transition ${
                    index === currentStep
                      ? 'border-[#0f2337] bg-[#0f2337] text-white shadow-sm'
                      : index < currentStep
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">Step {index + 1}</div>
                  <div className="mt-1 text-sm font-semibold">{step.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 p-3 sm:gap-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="min-w-0 space-y-5">
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

              {currentStep === 0 && (
                <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Service Type</label>
                  <select
                    className="input-field"
                    value={form.service_type}
                    onChange={(e) => handleServiceChange(e.target.value)}
                  >
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {SERVICE_LABELS[s] || s}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 rounded-2xl border border-[#f2e4bb] bg-[#fffaf0] p-3 text-sm text-slate-700">
                    <div className="mb-1.5"><span className="font-semibold text-[#0f2337]">Parish schedule:</span> {SERVICE_SCHEDULE[form.service_type]}</div>
                    <div><span className="font-semibold text-[#0f2337]">Requirements:</span> {SERVICE_REQUIREMENTS[form.service_type]}</div>
                  </div>
                </div>
              )}

              {!isBaptismFlow && !isMarriageFlow && currentStep === 1 && (
                <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Personal Information</h3>
                  <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                    <div><span className="block text-xs text-slate-500">Full Name</span><span className="font-medium text-slate-800">{user?.fullname || 'Not available'}</span></div>
                    <div><span className="block text-xs text-slate-500">Email Address</span><span className="font-medium text-slate-800">{user?.email || 'Not available'}</span></div>
                    <div><span className="block text-xs text-slate-500">Contact Number</span><span className="font-medium text-slate-800">{user?.phone || 'Not available'}</span></div>
                    <div><span className="block text-xs text-slate-500">Address</span><span className="font-medium text-slate-800">{user?.address || 'Not available'}</span></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {getRequiredServiceDetails().map((field) => (
                      <label key={field.key} className="block text-sm text-slate-700 sm:col-span-2">
                        <span className="mb-2 block font-medium text-slate-700">{field.label}</span>
                        {field.key === 'prayer_intention' ? <textarea
                          className="input-field min-h-[110px]"
                          value={form.serviceDetails[field.key] || ''}
                          onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, [field.key]: e.target.value } })}
                          placeholder={field.label}
                        /> : <input
                          type="text"
                          className="input-field"
                          value={form.serviceDetails[field.key] || ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              serviceDetails: {
                                ...form.serviceDetails,
                                [field.key]: e.target.value,
                              },
                            })
                          }
                          placeholder={field.label}
                        />}
                      </label>
                    ))}
                  </div>
                  <section className="mt-6 space-y-4" aria-label="Payment information">
                    <div className="overflow-hidden rounded-2xl border border-[#e2ddd3] bg-[#fffdf8] shadow-[0_8px_18px_rgba(39,55,70,0.06)]">
                      <div className="flex items-center justify-between gap-3 bg-[#168fe0] px-4 py-3 text-white sm:px-5">
                        <h3 className="text-base font-bold leading-tight">GCash</h3>
                        <span className="shrink-0 rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white">Mobile wallet</span>
                      </div>
                      <dl className="divide-y divide-[#eee7db] px-4 sm:px-5">
                        <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7c5f]">Account name</dt>
                          <dd className="break-words text-sm font-semibold leading-5 text-[#273746] sm:text-right">holy family parish</dd>
                        </div>
                        <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7c5f]">GCash number</dt>
                          <dd className="font-mono text-sm font-semibold tabular-nums tracking-[0.04em] text-[#1f3342] sm:text-right">0967 394 1188</dd>
                        </div>
                      </dl>
                    </div>
                    {form.service_type === 'Mass Intention' && (
                      <div className="rounded-2xl border border-[#e7d7ac] bg-[#f5efdf] p-4 text-sm leading-6 text-[#514638] sm:p-5">
                        <p className="font-semibold text-[#594726]">Mass Intention Fee <span className="ml-1 whitespace-nowrap">₱100.00 per Mass Intention</span></p>
                        <p className="mt-1.5">Please send the payment using the parish GCash account above, then upload your receipt as proof.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {isMarriageFlow && currentStep === 1 && (
                <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Personal Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {marriagePersonalFields.map(([key, label, type]) => (
                      <label key={key} className="block text-sm text-slate-700 sm:col-span-2">
                        <span className="mb-2 block font-medium">{label}</span>
                        <input
                          type={type}
                          className="input-field"
                          value={form.personalDetails?.[key] || ''}
                          onChange={(event) => setForm((prev) => ({ ...prev, personalDetails: { ...prev.personalDetails, [key]: event.target.value } }))}
                          required
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isMarriageFlow && currentStep === 2 && (
                <div className="space-y-5">
                  {[
                    ['Bride Information', marriageCoupleFields.slice(0, 8)],
                    ['Groom Information', marriageCoupleFields.slice(8)],
                  ].map(([heading, fields]) => (
                    <section key={heading} className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{heading}</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                          <label key={field.key} className={`block text-sm text-slate-700 ${field.key.includes('address') || field.key.includes('birth_place') ? 'sm:col-span-2' : ''}`}>
                            <span className="mb-2 block font-medium">{field.label}</span>
                            {field.key.includes('address') ? (
                              <textarea className="input-field min-h-[90px]" value={form.serviceDetails[field.key] || ''} onChange={(event) => setForm((prev) => ({ ...prev, serviceDetails: { ...prev.serviceDetails, [field.key]: event.target.value } }))} required />
                            ) : (
                              <input
                                type={
                                  field.key.includes('birthdate')
                                    ? 'date'
                                    : field.key.includes('age')
                                      ? 'number'
                                      : field.key.includes('contact')
                                        ? 'tel'
                                        : 'text'
                                }
                                min={field.key.includes('age') ? 18 : undefined}
                                max={field.key.includes('age') ? 120 : undefined}
                                className="input-field"
                                value={form.serviceDetails[field.key] || ''}
                                onChange={(event) => setForm((prev) => ({ ...prev, serviceDetails: { ...prev.serviceDetails, [field.key]: event.target.value } }))}
                                required
                              />
                            )}
                          </label>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {isBaptismFlow && currentStep === 1 && (
                <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Child Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">First Name</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_first_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_first_name: e.target.value } })} placeholder="First Name" />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Middle Name</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_middle_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_middle_name: e.target.value } })} placeholder="Middle Name" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Last Name</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_last_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_last_name: e.target.value } })} placeholder="Last Name" />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Date of Birth</span>
                      <input type="date" className="input-field" value={form.serviceDetails.child_birthdate || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_birthdate: e.target.value } })} />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Place of Birth</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_birth_place || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_birth_place: e.target.value } })} placeholder="Place of Birth" />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Sex</span>
                      <select className="input-field" value={form.serviceDetails.child_sex || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_sex: e.target.value } })}>
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">House / Street</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_address_street || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_address_street: e.target.value } })} placeholder="House / Street" />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Barangay</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_address_barangay || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_address_barangay: e.target.value } })} placeholder="Barangay" />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium text-slate-700">Municipality</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_address_municipality || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_address_municipality: e.target.value } })} placeholder="Municipality" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Province</span>
                      <input type="text" className="input-field" value={form.serviceDetails.child_address_province || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, child_address_province: e.target.value } })} placeholder="Province" />
                    </label>
                  </div>
                </div>
              )}

              {isBaptismFlow && currentStep === 2 && (
                <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Parent / Sponsor Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Father's Full Name</span>
                      <input type="text" className="input-field" value={form.serviceDetails.father_full_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, father_full_name: e.target.value } })} placeholder="Father's Full Name" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Mother's Full Name</span>
                      <input type="text" className="input-field" value={form.serviceDetails.mother_full_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, mother_full_name: e.target.value } })} placeholder="Mother's Full Name" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Contact Number</span>
                      <input type="tel" className="input-field" value={form.serviceDetails.requester_contact_number || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, requester_contact_number: e.target.value } })} placeholder="Contact Number" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Name of Ninong / Ninang</span>
                      <input type="text" className="input-field" value={form.serviceDetails.sponsor_name || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, sponsor_name: e.target.value } })} placeholder="Ninong / Ninang Name" />
                    </label>
                    <label className="block text-sm text-slate-700 sm:col-span-2">
                      <span className="mb-2 block font-medium text-slate-700">Ninong / Ninang Contact Number</span>
                      <input type="tel" className="input-field" value={form.serviceDetails.sponsor_contact_number || ''} onChange={(e) => setForm({ ...form, serviceDetails: { ...form.serviceDetails, sponsor_contact_number: e.target.value } })} placeholder="Contact Number" />
                    </label>
                  </div>
                </div>
              )}

              {(isMarriageFlow ? currentStep === 3 : (isBaptismFlow ? currentStep === 3 : currentStep === 2)) && (
                <>
                  <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Select Date</label>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">Calendar</span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                          onClick={() => {
                            const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
                            setCalendarMonth(toIsoMonth(d));
                          }}
                        >
                          ← Prev
                        </button>
                        <div className="text-sm font-semibold text-[#0f2337]">{formatMonthLabel(calendarMonth)}</div>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                          onClick={() => {
                            const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
                            setCalendarMonth(toIsoMonth(d));
                          }}
                        >
                          Next →
                        </button>
                      </div>

                      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {WEEKDAY_LABELS.map((day) => (
                          <div key={day} className="py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {dateCells.map((iso, idx) => {
                          if (!iso) {
                            return <div key={`empty-${idx}`} className="h-11" />;
                          }
                          const status = dateStatuses[iso]?.status || 'unavailable';
                          const isSelected = form.reservation_date === iso;
                          const isPastOrTooSoon = iso < minDate;
                          const isAvailable = status === 'available' && !isPastOrTooSoon;
                          const isFull = status === 'full' && !isPastOrTooSoon;

                          let bgCls = 'border border-slate-200 bg-slate-100 text-slate-400';
                          if (isAvailable) bgCls = 'border border-emerald-300 bg-emerald-100 text-emerald-800';
                          if (isFull) bgCls = 'border border-red-300 bg-red-100 text-red-800';
                          if (isSelected) bgCls += ' ring-2 ring-[#0f2337] ring-offset-1';

                          return (
                            <button
                              key={iso}
                              type="button"
                              disabled={!isAvailable}
                              title={
                                isFull
                                  ? 'Fully booked'
                                  : isPastOrTooSoon
                                    ? 'Not available'
                                    : isAvailable
                                      ? 'Available — click to select'
                                      : 'Not available for this service'
                              }
                              className={`h-11 rounded-xl text-xs font-semibold transition ${bgCls} ${
                                isAvailable ? 'cursor-pointer hover:brightness-95' : 'cursor-not-allowed'
                              }`}
                              onClick={() => handleDateSelect(iso)}
                            >
                              {Number(iso.slice(8, 10))}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5"><span className="inline-block h-3.5 w-3.5 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Available</div>
                        <div className="flex items-center gap-1.5"><span className="inline-block h-3.5 w-3.5 rounded bg-red-100 ring-1 ring-red-300" /> Fully booked</div>
                        <div className="flex items-center gap-1.5"><span className="inline-block h-3.5 w-3.5 rounded bg-slate-100 ring-1 ring-slate-300" /> Not available</div>
                      </div>

                      {form.reservation_date && (
                        <p className="mt-3 text-sm font-medium text-[#0f2337]">
                          Selected: {new Date(form.reservation_date + 'T12:00:00').toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4 sm:p-5">
                    <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Select Time Slot</label>
                    {form.reservation_date ? (
                      slotItems.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {slotItems.map((slot) => {
                            const isAvailable = slot.status === 'available';
                            const isSelected = form.reservation_time === slot.time;
                            const base = 'w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition';
                            const cls = isAvailable
                              ? `bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 ${isSelected ? 'ring-2 ring-emerald-500' : ''}`
                              : 'border-red-300 bg-red-50 text-red-800 cursor-not-allowed';
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!isAvailable}
                                className={`${base} ${cls}`}
                                onClick={() => setForm({ ...form, reservation_time: slot.time })}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-base">{formatSlotTime(slot.time)}</span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAvailable ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
                                    {form.service_type === 'Mass Intention'
                                      ? (isAvailable ? 'Available' : 'Full')
                                      : (isAvailable ? 'Available' : 'Full')}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          No time slots are available for this service on the selected date. Choose a green date on the calendar or another service day per the parish schedule.
                        </div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Pick a green date on the calendar to see available time slots.
                      </div>
                    )}
                  </div>
                </>
              )}

              {(isMarriageFlow ? currentStep === 4 : (isBaptismFlow ? currentStep === 4 : currentStep === 3)) && (
                <div className="space-y-5">
                  <DocumentUpload requirements={docRequirements} initialFiles={uploadedFiles} onFilesChange={setUploadedFiles} />

                  <div className="rounded-[24px] border border-[#d7b57a] bg-[#fffaf0] p-4 sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#775b25]">Before you continue</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li>• Confirm your selected date and time.</li>
                      <li>• Upload all required documents before submitting.</li>
                      <li>• Your request will be reviewed by the parish office.</li>
                    </ul>
                  </div>
                </div>
              )}

              {!isMarriageFlow && (isBaptismFlow ? currentStep === 5 : currentStep === 4) && (
                <div className="min-w-0 space-y-4 sm:space-y-5">
                  <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 sm:rounded-[24px] sm:p-5">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:tracking-[0.18em]">Review Reservation</h3>
                    <div className="min-w-0 space-y-3 text-sm text-slate-700">
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Service</div>
                        <div className="mt-1 font-semibold text-[#0f2337]">{SERVICE_LABELS[form.service_type] || form.service_type}</div>
                      </div>
                      {form.service_type === 'Mass Intention' && (
                        <div className="min-w-0 rounded-xl border border-[#f2e4bb] bg-[#fffaf0] p-3 sm:p-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Payment</div>
                          <div className="mt-1 font-semibold text-[#0f2337]">Mass Intention Fee: ₱100.00</div>
                          <div className="mt-1 text-sm text-slate-700">Payment method: GCash</div>
                          <div className="mt-1 text-sm text-slate-700">Payment Receipt: {uploadedFiles.payment_receipt ? 'Uploaded' : 'Missing'}</div>
                        </div>
                      )}
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Date & Time</div>
                        <div className="mt-1 break-words font-semibold leading-5 text-[#0f2337]">
                          {form.reservation_date ? new Date(form.reservation_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not selected'}
                          {' · '}
                          {form.reservation_time ? formatSlotTime(form.reservation_time) : 'Not selected'}
                        </div>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Details</div>
                        <ul className="mt-2 min-w-0 space-y-2">
                          {Object.entries(form.serviceDetails || {}).map(([key, value]) => {
                            if (!String(value || '').trim()) return null;
                            const label = (SERVICE_DETAIL_FIELDS[form.service_type] || []).find((item) => item.key === key)?.label || key;
                            return (
                              <li key={key} className="min-w-0 border-b border-slate-100 pb-2 last:border-0 last:pb-0 sm:grid sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-2">
                                <span className="block text-xs font-semibold text-slate-600 sm:text-sm">{label}</span>
                                <span className="mt-0.5 block break-words leading-5 sm:mt-0">{value}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Uploaded Requirements</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.keys(uploadedFiles).length > 0 ? (
                            Object.keys(uploadedFiles).map((docType) => (
                              <span key={docType} className="max-w-full break-words rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                                {(docRequirements.find((document) => document.type === docType)?.name || docType).replace(/_/g, ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500">No documents uploaded yet.</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</label>
                        <textarea
                          className="input-field min-h-[80px] min-w-0 resize-y"
                          value={form.requirements}
                          onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isMarriageFlow && currentStep === 5 && (
                <div className="min-w-0 space-y-4 sm:space-y-5">
                  <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 sm:rounded-[24px] sm:p-5">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:tracking-[0.18em]">Review Marriage Request</h3>
                    <div className="min-w-0 w-full max-w-full space-y-3 text-sm text-slate-700 sm:space-y-4">
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Service Type</p>
                        <p className="mt-1 font-semibold text-[#0f2337]">{SERVICE_LABELS[form.service_type] || form.service_type}</p>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Personal Information</p>
                        <div className="mt-2 space-y-2">
                          {marriagePersonalFields.map(([key, label]) => (
                            <p key={key} className="grid min-w-0 grid-cols-1 border-b border-slate-100 pb-2 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-2">
                              <strong className="block min-w-0 text-xs text-slate-600 sm:text-sm">{label}</strong>
                              <span className="mt-0.5 block min-w-0 break-all leading-5 sm:mt-0">{form.personalDetails?.[key] || 'Not provided'}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      {[
                        ['Bride Information', marriageCoupleFields.slice(0, 6)],
                        ['Groom Information', marriageCoupleFields.slice(6)],
                      ].map(([heading, fields]) => (
                        <div key={heading} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{heading}</p>
                          <div className="mt-2 space-y-2">
                            {fields.map((field) => (
                              <p key={field.key} className="grid min-w-0 grid-cols-1 border-b border-slate-100 pb-2 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-2">
                                <strong className="block min-w-0 text-xs text-slate-600 sm:text-sm">{field.label}</strong>
                                <span className="mt-0.5 block min-w-0 break-words leading-5 sm:mt-0">{form.serviceDetails[field.key] || 'Not provided'}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Date &amp; Time</p>
                        <p className="mt-1 break-words font-semibold leading-5 text-[#0f2337]">
                          {form.reservation_date ? new Date(form.reservation_date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not selected'}
                          {' · '}
                          {form.reservation_time ? formatSlotTime(form.reservation_time) : 'Not selected'}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Marriage Requirements</p>
                        <div className="mt-2 space-y-2">
                          {docRequirements.map((document) => (
                            <p key={document.type} className="grid min-w-0 grid-cols-1 border-b border-slate-100 pb-2 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-2">
                              <strong className="block min-w-0 text-xs text-slate-600 sm:text-sm">{document.name}</strong>
                              <span className="mt-0.5 block min-w-0 break-all leading-5 sm:mt-0">{uploadedFiles[document.type]?.name || 'Missing'}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {currentStep !== activeSteps.length - 1 && (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Progress</h3>
                    <span className="rounded-full bg-[#f5ead0] px-2 py-1 text-[10px] font-medium text-[#775b25]">
                      {currentStep + 1}/{activeSteps.length}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Confirm your service and personal details.</li>
                    <li>• Choose an available date and time.</li>
                    <li>• Upload all required documents.</li>
                    <li>• Review and submit for parish review.</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                {currentStep > 0 && (
                  <button type="button" className="btn-outline flex-1" onClick={handleBackStep}>
                    Back
                  </button>
                )}
                {currentStep < activeSteps.length - 1 ? (
                  <button type="button" className="btn-primary flex-1" onClick={handleNextStep}>
                    Next
                  </button>
                ) : (
                  <button type="button" className="btn-primary flex-1" onClick={handleSubmit} disabled={uploadingDocs}>
                    {uploadingDocs ? 'Submitting...' : isMarriageFlow ? 'Submit Request' : isBaptismFlow ? 'Submit Baptism Reservation' : 'Submit Reservation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-[26px] border border-[#ece4d3] bg-[#fffdf8] shadow-[0_14px_30px_rgba(83,65,34,0.06)]">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-display text-lg font-semibold text-[#2f2a22]">Reservation record</h2>
          <span className="rounded-full border border-[#e7dfd2] bg-[#f7f3eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a8666]">
            Updated
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-y border-[#f1e9da] bg-[#faf5ea] text-left text-[10px] uppercase tracking-[0.16em] text-[#9a8666]">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Time</th>
                <th className="px-5 py-3 font-semibold">Purpose</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Documents</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleReservations.map((r) => {
                const docs = reservationDocuments[r.id] || [];
                const verifiedCount = docs.filter(d => d.status === 'Verified').length;
                const rejectedCount = docs.filter(d => d.status === 'Rejected').length;
                const docPendingCount = docs.filter(d => d.status === 'Pending').length;
                const totalDocs = docs.length;

                return (
                  <tr key={r.id} className="border-b border-[#f5efe2] align-top transition duration-200 hover:bg-[#faf5ea]">
                    <td className="px-5 py-4 text-[#5b5344]">{r.reservation_date}</td>
                    <td className="px-5 py-4 text-[#5b5344]">{formatSlotTime(r.reservation_time || '')}</td>
                    <td className="px-5 py-4 font-medium text-[#2f2a22]">{SERVICE_LABELS[r.service_type] || r.service_type}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      {loadingDocs[r.id] ? (
                        <span className="text-xs text-[#9a8f78]">Loading...</span>
                      ) : totalDocs > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Verified {verifiedCount}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Pending {docPendingCount}</span>
                            <span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Rejected {rejectedCount}</span>
                          </div>
                          {rejectedCount > 0 && (
                            <div className="space-y-2 text-xs text-rose-700">
                              {docs.filter(d => d.status === 'Rejected').map(d => (
                                <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-rose-50 px-2.5 py-2">
                                  <span>
                                    {d.document_name}
                                    {d.remarks && <span className="italic">: "{d.remarks}"</span>}
                                  </span>
                                  <button
                                    type="button"
                                    className="rounded-lg bg-[#b18a45] px-3 py-2 font-medium text-white underline-offset-2 transition hover:bg-[#967338]"
                                    onClick={() => handleDocumentReplace(r.id, d.document_type)}
                                  >
                                    Select File
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9a8f78]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setViewing(r);
                            loadReservationDocuments(r.id).catch(() => {});
                          }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#a6813f] transition hover:text-[#8d6928]"
                        >
                          View <span aria-hidden="true">›</span>
                        </button>
                        {['Pending', 'Under Review'].includes(r.status) && (
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(r)}
                            disabled={cancellingReservationId !== null}
                            className="text-sm font-semibold text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancellingReservationId === r.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reservations.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-[#9a8f78]">
            No reservations yet.
          </div>
        )}
      </div>
      {totalReservations > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6e7274]">
            Showing {(currentReservationPage - 1) * RESERVATIONS_PER_PAGE + 1}–{Math.min(currentReservationPage * RESERVATIONS_PER_PAGE, totalReservations)} of {totalReservations} reservations
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReservationPage(currentReservationPage - 1)}
              disabled={currentReservationPage === 1}
              className="rounded-lg border border-[#e7dfd2] bg-white px-4 py-2 text-sm font-medium text-[#58616a] transition hover:bg-[#faf5e9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-1 text-sm text-[#6e7274]">
              Page {currentReservationPage} of {reservationPageCount}
            </span>
            <button
              type="button"
              onClick={() => setReservationPage(currentReservationPage + 1)}
              disabled={currentReservationPage === reservationPageCount}
              className="rounded-lg border border-[#e7dfd2] bg-white px-4 py-2 text-sm font-medium text-[#58616a] transition hover:bg-[#faf5e9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Reservation Details" size="xl" backdropClassName="bg-[#14212b]/45">
        {viewing && (
          <div className="space-y-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#f1e9da] bg-[#faf5ea] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a8666]">Service</p>
                <p className="mt-1.5 font-semibold text-[#2f2a22]">{SERVICE_LABELS[viewing.service_type] || viewing.service_type}</p>
              </div>
              <div className="rounded-xl border border-[#f1e9da] bg-[#faf5ea] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a8666]">Status</p>
                <p className="mt-1.5"><StatusBadge status={viewing.status} /></p>
              </div>
              <div className="rounded-xl border border-[#f1e9da] bg-[#faf5ea] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a8666]">Date</p>
                <p className="mt-1.5 font-medium text-[#2f2a22]">
                  {viewing.reservation_date
                    ? new Date(`${viewing.reservation_date}T12:00:00`).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not provided'}
                </p>
              </div>
              <div className="rounded-xl border border-[#f1e9da] bg-[#faf5ea] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a8666]">Time</p>
                <p className="mt-1.5 font-medium text-[#2f2a22]">{formatSlotTime(viewing.reservation_time || '')}</p>
              </div>
            </div>
            {viewing.requirements && (
              (() => {
                const { fields, notes } = parseReservationDetails(viewing.requirements);
                return (
                  <section className="rounded-2xl border border-[#eee5d5] bg-white p-4 sm:p-5">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7957]">Request Details</h4>
                    {fields.length > 0 && (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {fields.map((field, index) => (
                          <div key={`${field.label}-${index}`} className="min-w-0 rounded-xl border border-[#f1e9da] bg-[#fdfbf7] p-3.5">
                            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9a8666]">{field.label}</dt>
                            <dd className="mt-1.5 break-words leading-5 text-[#413a30]">
                              {['n/a', 'na'].includes(field.value.toLowerCase()) ? 'Not provided' : field.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {notes.length > 0 && (
                      <div className={`${fields.length > 0 ? 'mt-4' : ''} rounded-xl bg-[#faf5ea] p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8d7957]">Additional Notes</p>
                        <p className="mt-1.5 whitespace-pre-line break-words leading-6 text-[#5b5344]">{notes.join('\n')}</p>
                      </div>
                    )}
                  </section>
                );
              })()
            )}
            {viewing.remarks && (
              <div className="rounded-xl border border-[#f1e9da] bg-[#fdfbf7] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a8666]">Parish Remarks</p>
                <p className="mt-2 break-words leading-6 text-[#5b5344]">{decodeDisplayText(viewing.remarks)}</p>
              </div>
            )}
            <div className="rounded-xl border border-[#f1e9da] bg-white p-4">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d7957]">Documents</h4>
              {loadingDocs[viewing.id] ? (
                <p className="mt-2 text-[#9a8f78]">Loading uploaded documents...</p>
              ) : documentLoadErrors[viewing.id] ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p className="text-rose-700">{documentLoadErrors[viewing.id]}</p>
                  <button
                    type="button"
                    onClick={() => loadReservationDocuments(viewing.id).catch(() => {})}
                    className="rounded-lg border border-[#e3d9c7] px-3 py-2 font-medium text-[#745d32] transition hover:bg-[#faf5ea]"
                  >
                    Retry
                  </button>
                </div>
              ) : (reservationDocuments[viewing.id] || []).length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {(reservationDocuments[viewing.id] || []).map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#fdfbf7] px-3 py-2.5 text-[#5b5344]">
                      <span className="min-w-0 flex-1 break-words">
                        <span className="block font-medium">{d.document_name}</span>
                        {d.original_filename && (
                          <span className="mt-0.5 block text-xs text-[#817663]">{d.original_filename}</span>
                        )}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          d.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {d.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => previewReservationDocument(d)}
                          className="rounded-lg border border-[#e3d9c7] bg-white px-3 py-1.5 text-xs font-semibold text-[#745d32] transition hover:bg-[#faf5ea]"
                        >
                          Preview
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[#9a8f78]">No documents uploaded.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
      <ImagePreviewModal
        isOpen={Boolean(documentPreview?.url)}
        src={documentPreview?.url}
        alt={documentPreview?.doc?.original_filename || documentPreview?.doc?.document_name}
        type={documentPreview?.contentType}
        title={documentPreview?.doc?.document_name || 'Document Preview'}
        onClose={closeDocumentPreview}
      />
      {documentPreview && !documentPreview.url && (
        <Modal
          isOpen
          onClose={closeDocumentPreview}
          title={documentPreview.doc.document_name || 'Document Preview'}
          size="md"
          backdropClassName="bg-[#14212b]/60"
        >
          {documentPreview.loading ? (
            <p className="py-4 text-sm text-[#6e7274]">Loading preview...</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-rose-700">{documentPreview.error}</p>
              <button type="button" onClick={() => previewReservationDocument(documentPreview.doc)} className="btn-primary">
                Try again
              </button>
            </div>
          )}
        </Modal>
      )}
      </div>
    </DashboardLayout>
  );
}
