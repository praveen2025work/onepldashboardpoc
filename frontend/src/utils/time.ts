/**
 * Parse a 12h time string like "2:29:00 PM" to decimal hours (14.483).
 * Used for chart Y-axis positioning.
 */
export function parseTimeTo24h(timeStr: string): number {
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return 0;

  const [hms, ampm] = parts;
  const [hStr, mStr, sStr] = hms.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const s = parseInt(sStr, 10) || 0;

  const isPm = ampm.toUpperCase() === 'PM';
  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;

  return h + m / 60 + s / 3600;
}

/**
 * Format a business date string like "2026-02-03" to "Feb 3".
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
