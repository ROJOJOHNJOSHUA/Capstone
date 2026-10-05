export function getPasswordValidationError(password) {
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password should be a combination of letter and number.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return '';
}
