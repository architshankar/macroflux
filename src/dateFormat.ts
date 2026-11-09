// Backend timestamps are offset-aware ISO strings (IST, e.g.
// "2026-11-10T14:03:22.123+05:30"). `new Date()` honours the offset, so the
// resulting instant is correct regardless of the browser's zone — never strip
// the offset or append "Z".

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | null | undefined, fallback = '—'): string {
  const d = parse(iso);
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : fallback;
}

export function formatDateTime(iso: string | null | undefined, fallback = '—'): string {
  const d = parse(iso);
  return d
    ? d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : fallback;
}
