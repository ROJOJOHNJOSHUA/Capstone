export function normalizePhilippineMobileInput(value) {
  const raw = String(value || '').trim();
  let digits = raw.replace(/\D/g, '');
  if (/^\+63/.test(raw) || (digits.length > 10 && digits.startsWith('63'))) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 10);
}

export function validatePhilippineMobileDigits(digits, requireComplete = true) {
  if (!digits) return requireComplete ? 'Enter all 10 digits after +63.' : '';
  if (!digits.startsWith('9')) return 'The first digit after +63 must be 9.';
  if (requireComplete && digits.length !== 10) return 'Enter all 10 digits after +63.';
  return '';
}

export function formatPhilippineMobileNumber(digits) {
  return `+63${digits}`;
}