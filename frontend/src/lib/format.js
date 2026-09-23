const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DAY = 24 * 60 * 60 * 1000;

export function daysBetween(a, b = new Date()) {
  const from = a instanceof Date ? a : parseIso(a);
  if (!from) return null;
  return Math.floor((b.getTime() - from.getTime()) / DAY);
}

export function timeAgo(value) {
  const date = parseIso(value);
  if (!date) return '—';
  const days = daysBetween(date);
  if (days === null) return '—';
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function monthsLabel(value) {
  const date = parseIso(value);
  if (!date) return null;
  const days = daysBetween(date);
  if (days === null) return null;
  if (days < 7) return 'updated recently';
  return `last updated ${timeAgo(date)}`;
}

export function formatDate(value) {
  const date = parseIso(value);
  if (!date) return '—';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateTime(value) {
  const date = parseIso(value);
  if (!date) return '—';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)} · ${hh}:${mm}`;
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function formatSize(kb) {
  const n = Number(kb) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} GB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} MB`;
  if (n >= 1) return `${Math.round(n)} KB`;
  return `${Math.round(n * 1024)} B`;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function dayGroupLabel(value) {
  const date = parseIso(value);
  if (!date) return 'Earlier';
  const days = daysBetween(date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return formatDate(value);
  return formatDate(value);
}