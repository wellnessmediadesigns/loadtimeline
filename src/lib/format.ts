/** Date / time / duration formatting helpers. */
import dayjs from 'dayjs';

export function formatTime(ts: number): string {
  return dayjs(ts).format('h:mm A');
}

export function formatDate(ts: number): string {
  return dayjs(ts).format('MMM D, YYYY');
}

export function formatDateTime(ts: number): string {
  return dayjs(ts).format('MMM D, YYYY · h:mm A');
}

export function formatDayLabel(ts: number): string {
  const d = dayjs(ts);
  if (d.isSame(dayjs(), 'day')) return 'Today';
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('ddd, MMM D');
}

export function relativeFromNow(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Milliseconds -> "2h 31m" style. Returns "0m" for non-positive. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return '0m';
  const totalMins = Math.round(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Compact decimal hours, e.g. 2.5 -> "2.5h". */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 10) / 10}h`;
}

export function shortCoords(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
