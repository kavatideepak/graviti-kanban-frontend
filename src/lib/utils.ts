export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Short, friendly due-date label, e.g. "Jul 25" (or "Jul 25, 2027" if not this year).
export function formatDueDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

// True if the due date is before the start of today.
export function isOverdue(iso: string): boolean {
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const POSITION_STEP = 1000;

// Midpoint position between two optional neighbors (mirrors the server helper).
export function between(prev?: number, next?: number): number {
  if (prev == null && next == null) return POSITION_STEP;
  if (prev == null) return (next as number) - POSITION_STEP;
  if (next == null) return (prev as number) + POSITION_STEP;
  return (prev + next) / 2;
}
