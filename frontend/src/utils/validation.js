/**
 * Standard Form Validation Utilities
 * Ensures email and mobile number fields strictly follow proper formats.
 */

// Email regex pattern: standard RFC-compliant pattern
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Indian mobile phone regex: 10 digits starting with 6, 7, 8, or 9
export const PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates whether the given string is a valid email address.
 * Example: abcd123@gmail.com
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Strips non-digit characters from mobile input, limiting to 10 digits.
 */
export function sanitizeMobileInput(value) {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 10);
}

/**
 * Validates whether the given string is a valid 10-digit mobile number.
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10 && PHONE_REGEX.test(digitsOnly);
}

/**
 * Returns real-time visual feedback for an email field.
 */
export function getEmailFeedback(email) {
  if (!email) return null;
  if (isValidEmail(email)) {
    return { valid: true, message: '✓ Valid email address' };
  }
  return { valid: false, message: '⚠️ Invalid format. Example: abcd123@gmail.com' };
}

/**
 * Returns real-time visual feedback for a mobile phone field.
 */
export function getPhoneFeedback(phone) {
  if (!phone) return null;
  const digits = sanitizeMobileInput(phone);
  if (digits.length === 0) return null;
  if (digits.length < 10) {
    return { valid: false, message: `⚠️ Enter 10 digits (${digits.length}/10 entered)` };
  }
  if (!PHONE_REGEX.test(digits)) {
    return { valid: false, message: '⚠️ Must start with 6, 7, 8, or 9' };
  }
  return { valid: true, message: '✓ Valid 10-digit mobile number' };
}
