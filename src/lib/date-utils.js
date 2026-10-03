/**
 * Dhaka Timezone (Asia/Dhaka, UTC+6) Date & Time Formatting Utilities
 * Standardizes 12-hour AM/PM formats across invoices, vouchers, receipts, and dashboards.
 */

export const DHAKA_TIMEZONE = 'Asia/Dhaka';

/**
 * Formats a date into Dhaka timezone with 12-hour time (e.g., "03 Oct 2026, 05:15 PM" or "03/10/2026, 05:15:20 PM")
 */
export function formatDhakaDateTime(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('en-US', {
    timeZone: DHAKA_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}

/**
 * Formats a date into standard Dhaka receipt format (e.g., "10/02/2026, 09:49:26 PM")
 */
export function formatDhakaReceiptDateTime(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString('en-US', {
    timeZone: DHAKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options
  });
}

/**
 * Formats a date into Dhaka timezone date only (e.g., "03 Oct 2026")
 */
export function formatDhakaDate(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-GB', {
    timeZone: DHAKA_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  });
}

/**
 * Formats a date into 12-hour Dhaka time (e.g., "05:15 PM" or "05:15:30 PM")
 */
export function formatDhakaTime(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleTimeString('en-US', {
    timeZone: DHAKA_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}

/**
 * Returns the current date/time in ISO string adjusted or formatted
 */
export function getDhakaNow() {
  return new Date();
}
