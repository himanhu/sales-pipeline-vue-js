// Reuse Intl instances across virtual row renders instead of rebuilding them per cell.
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' });

export function formatINR(amount) {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(timestamp) {
  return shortDate.format(timestamp);
}

export function formatDateTime(value) {
  return dateTime.format(value);
}

export function formatFullDate(value) {
  return fullDate.format(value);
}

export function formatTime(value) {
  return time.format(value);
}

export function formatFieldValue(field, value) {
  if (field === 'closeAt' || field === 'lastTouchAt') return formatDateTime(value);
  if (field === 'amount') return '₹' + Number(value).toLocaleString('en-IN');
  return String(value ?? 'Unassigned');
}
