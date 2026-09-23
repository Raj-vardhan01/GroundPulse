/* ════════════════════════════════════════════════════════════════
   Dates the way an owner reads them — Indian order, and always on
   Bengaluru's clock.

   Every visit happens in India, so "Sunday 10:00 – 13:00" only means
   one thing if it is read in IST. Formatting in whatever zone the
   server happens to run in (UTC on Vercel) is what put this morning's
   events under "yesterday" and made the server and the browser
   disagree about which days could be booked. So nothing here reads the
   host's local time: every day and every clock time is IST.
   ════════════════════════════════════════════════════════════════ */

export const TZ = "Asia/Kolkata";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const d = (iso: string) => new Date(iso);

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** "2026-09-23" — the calendar day in Bengaluru. A bare "YYYY-MM-DD" is
    already a day and comes back unchanged. */
export function dayKey(x: string | Date = new Date()): string {
  if (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)) return x;
  return keyFmt.format(typeof x === "string" ? new Date(x) : x);
}

/** Today in Bengaluru. */
export const todayKey = () => dayKey(new Date());

/** Day arithmetic on "YYYY-MM-DD" keys, done in UTC so no zone can shift it. */
export function addDays(key: string, n: number): string {
  const [y, m, dd] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string): number {
  const a = from.split("-").map(Number);
  const b = to.split("-").map(Number);
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86_400_000);
}

/** Day of the week (0 = Sunday) for a day key. */
const weekday = (key: string) => {
  const [y, m, dd] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
};

/** "12 Sep" · "12 Sep 2025" when it is not this year */
export function fmtDate(iso: string, opts: { year?: boolean } = {}) {
  const [y, m, dd] = dayKey(iso).split("-").map(Number);
  const thisYear = Number(todayKey().slice(0, 4));
  const yr = y === thisYear && !opts.year ? "" : ` ${y}`;
  return `${dd} ${MONTHS[m - 1]}${yr}`;
}
/** "Monday, 12 Sep" */
export const fmtDayDate = (iso: string) => `${DAYS[weekday(dayKey(iso))]}, ${fmtDate(iso)}`;
/** "14:02", IST */
export const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

/** "in 8 days" / "6 days ago" / "2h ago" — the phrasing the timeline uses.
    Counted in Bengaluru calendar days, not 24-hour blocks, so something
    that happened at nine this morning is not "yesterday" by the evening. */
export function relative(iso: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const days = daysBetween(todayKey(), dayKey(iso));
  if (!dateOnly) {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0 && ms > -3_600_000) return "just now";
    if (days === 0) return ms < 0 ? `${Math.max(1, Math.round(-ms / 3_600_000))}h ago` : `in ${Math.max(1, Math.round(ms / 3_600_000))}h`;
  } else if (days === 0) {
    return "today";
  }
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return days < 14 ? `in ${days} days` : `in ${Math.round(days / 7)} weeks`;
  const n = -days;
  return n < 14 ? `${n} days ago` : n < 60 ? `${Math.round(n / 7)} weeks ago` : `${Math.round(n / 30)} months ago`;
}

export const isPast = (iso: string) => d(iso).getTime() < Date.now();
/** Kept for older callers — both mean "the day in Bengaluru". */
export const todayISO = todayKey;
export const plusDays = (n: number) => addDays(todayKey(), n);

/* ── booking windows ──────────────────────────────────────────────
   One definition, used by the booking form, the reschedule panel and
   the server actions that check them — so the days a person is offered
   are exactly the days the server accepts. */

/** Two clear days before the first bookable date: an inspector has to be
    found, briefed and physically got to the address. */
export const LEAD_DAYS = 2;
/** How far ahead a single booking can go. */
export const WINDOW_DAYS = 60;

export type DayOption = { key: string; date: number; month: string; dow: string; first: boolean };

export function bookableDays(count = 28, lead = LEAD_DAYS): DayOption[] {
  const start = addDays(todayKey(), lead);
  return Array.from({ length: count }, (_, i) => {
    const key = addDays(start, i);
    const [, m, dd] = key.split("-").map(Number);
    return { key, date: dd, month: MONTHS[m - 1], dow: DAYS[weekday(key)].slice(0, 1), first: dd === 1 || i === 0 };
  });
}

/** Is this day one a visit can be booked or moved onto? */
export function isBookable(key: string, lead = LEAD_DAYS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const gap = daysBetween(todayKey(), key);
  return gap >= lead && gap <= WINDOW_DAYS;
}

/** The owner's own clock, next to IST — "18:30 your time". Falls back to
    nothing when the zone is IST anyway, or unknown. */
export function localTime(iso: string, tz: string | undefined | null) {
  if (!tz || tz === TZ) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** "10:00 – 13:00" IST → the same window on the owner's clock, for the day
    it happens on. Empty when they live on IST. */
export function slotInZone(dayKeyStr: string, slot: string, tz: string | undefined | null) {
  if (!tz || tz === TZ) return "";
  const m = slot.match(/(\d{2}):(\d{2})\s*–\s*(\d{2}):(\d{2})/);
  if (!m) return "";
  const at = (hh: string, mm: string) => new Date(`${dayKeyStr}T${hh}:${mm}:00+05:30`).toISOString();
  const a = localTime(at(m[1], m[2]), tz);
  const b = localTime(at(m[3], m[4]), tz);
  return a && b ? `${a} – ${b}` : "";
}
