/* Dates the way an owner reads them — Indian order, no timezone soup. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const d = (iso: string) => new Date(iso);

/** "12 Sep" · "12 Sep 2025" when it is not this year */
export function fmtDate(iso: string, opts: { year?: boolean } = {}) {
  const x = d(iso);
  const y = x.getFullYear() === new Date().getFullYear() && !opts.year ? "" : ` ${x.getFullYear()}`;
  return `${x.getDate()} ${MONTHS[x.getMonth()]}${y}`;
}
/** "Monday, 12 Sep" */
export const fmtDayDate = (iso: string) => `${DAYS[d(iso).getDay()]}, ${fmtDate(iso)}`;
export const fmtTime = (iso: string) =>
  d(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();

/** "in 8 days" / "6 days ago" / "2h ago" — the phrasing the timeline uses.
    Counted in calendar days, not in 24-hour blocks, so something that
    happened at nine this morning is not "yesterday" by the evening. */
export function relative(iso: string) {
  const then = d(iso);
  const ms = then.getTime() - Date.now();
  if (ms <= 0 && ms > -3_600_000) return "just now";
  const days = Math.round((startOfDay(then) - startOfDay(new Date())) / 86_400_000);
  if (days === 0) return ms < 0 ? `${Math.round(-ms / 3_600_000)}h ago` : `in ${Math.round(ms / 3_600_000)}h`;
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return days < 14 ? `in ${days} days` : `in ${Math.round(days / 7)} weeks`;
  const n = -days;
  return n < 14 ? `${n} days ago` : n < 60 ? `${Math.round(n / 7)} weeks ago` : `${Math.round(n / 30)} months ago`;
}

export const isPast = (iso: string) => d(iso).getTime() < Date.now();
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
