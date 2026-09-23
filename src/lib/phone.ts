/* ════════════════════════════════════════════════════════════════
   Phone numbers, for people who are mostly not in India.

   The owner is usually abroad, on a Dubai or London SIM. The sign-in
   used to assume +91 and cut whatever was typed down to ten digits —
   so "+971 50 123 4567" quietly became "+91 97150 12345", somebody
   else's number. Now the country is chosen (or read off a pasted
   "+971…"), nothing is ever truncated, and a number that does not fit
   its country is refused out loud.

   Stored form, one string per account:
     India      → ten digits, "9876543210" (every existing row already is)
     elsewhere  → E.164, "+971501234567"
   ════════════════════════════════════════════════════════════════ */

export type Country = { cc: string; name: string; min: number; max: number };

/* Where owners actually live, most common first. min/max are the
   national number's length without the trunk 0. */
export const COUNTRIES: Country[] = [
  { cc: "91", name: "India", min: 10, max: 10 },
  { cc: "971", name: "UAE", min: 8, max: 9 },
  { cc: "1", name: "US / Canada", min: 10, max: 10 },
  { cc: "44", name: "UK", min: 9, max: 10 },
  { cc: "65", name: "Singapore", min: 8, max: 8 },
  { cc: "61", name: "Australia", min: 9, max: 9 },
  { cc: "974", name: "Qatar", min: 8, max: 8 },
  { cc: "966", name: "Saudi Arabia", min: 9, max: 9 },
  { cc: "968", name: "Oman", min: 8, max: 8 },
  { cc: "965", name: "Kuwait", min: 8, max: 8 },
  { cc: "973", name: "Bahrain", min: 8, max: 8 },
  { cc: "49", name: "Germany", min: 10, max: 11 },
  { cc: "64", name: "New Zealand", min: 8, max: 10 },
  { cc: "353", name: "Ireland", min: 9, max: 9 },
  { cc: "31", name: "Netherlands", min: 9, max: 9 },
  { cc: "33", name: "France", min: 9, max: 9 },
  { cc: "852", name: "Hong Kong", min: 8, max: 8 },
  { cc: "60", name: "Malaysia", min: 9, max: 10 },
  { cc: "41", name: "Switzerland", min: 9, max: 9 },
  { cc: "46", name: "Sweden", min: 9, max: 9 },
];

const byLongestCode = [...COUNTRIES].sort((a, b) => b.cc.length - a.cc.length);

export const isIndianMobile = (national: string) => /^[6-9]\d{9}$/.test(national);

type Parsed = { ok: true; phone: string } | { ok: false; error: string };

/** Turn what somebody typed into the one form we store.
    `cc` is the country picked in the form; a number typed with its own
    "+…" or "00…" prefix wins over it. */
export function parsePhone(cc: string, raw: string): Parsed {
  const typed = raw.trim();
  let digits = typed.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Add your mobile number." };

  let country = COUNTRIES.find((c) => c.cc === cc) ?? COUNTRIES[0];
  const international = typed.startsWith("+") || typed.startsWith("00");
  if (international) {
    if (typed.startsWith("00")) digits = digits.slice(2);
    const hit = byLongestCode.find((c) => digits.startsWith(c.cc));
    if (hit) {
      country = hit;
      digits = digits.slice(hit.cc.length);
    } else {
      /* A country we do not list: accept any plausible E.164 number
         rather than refuse a real person. */
      if (digits.length < 8 || digits.length > 15) return { ok: false, error: "That number does not look complete. Check the country code." };
      return { ok: true, phone: `+${digits}` };
    }
  } else if (country.cc === "91" && digits.length === 12 && digits.startsWith("91")) {
    /* "91 98765 43210" typed into the Indian box */
    digits = digits.slice(2);
  }

  /* Most countries write the trunk 0 at home — 07… in the UK, 050… in the
     UAE. It is never part of the international number. */
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");

  if (country.cc === "91") {
    if (!isIndianMobile(digits)) return { ok: false, error: "That does not look like an Indian mobile number — ten digits, starting 6 to 9." };
    return { ok: true, phone: digits };
  }
  if (digits.length < country.min || digits.length > country.max) {
    const want = country.min === country.max ? `${country.min}` : `${country.min}–${country.max}`;
    return { ok: false, error: `A ${country.name} mobile number has ${want} digits after +${country.cc}.` };
  }
  return { ok: true, phone: `+${country.cc}${digits}` };
}

/** Is this already a stored account number? Used to re-check hidden
    fields, which the browser can change. */
export const isAccountPhone = (p: string) => isIndianMobile(p) || /^\+\d{8,15}$/.test(p);

/** Split a stored number back into country and national part. */
export function splitPhone(p: string): { cc: string; national: string } {
  if (isIndianMobile(p)) return { cc: "91", national: p };
  const digits = p.replace(/\D/g, "");
  const hit = byLongestCode.find((c) => digits.startsWith(c.cc));
  return hit ? { cc: hit.cc, national: digits.slice(hit.cc.length) } : { cc: "", national: digits };
}

/** "+91 98765 43210" · "+971 50 123 4567" */
export function prettyPhone(p: string) {
  if (!p) return "";
  if (p.startsWith("deleted:")) return "—";
  const { cc, national } = splitPhone(p);
  if (cc === "91") return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  if (!cc) return `+${national}`;
  const groups = national.length > 7 ? [national.slice(0, national.length - 7), national.slice(-7, -4), national.slice(-4)] : [national.slice(0, 3), national.slice(3)];
  return `+${cc} ${groups.filter(Boolean).join(" ")}`;
}

/** What goes after tel: — always international. */
export const telHref = (p: string) => (isIndianMobile(p) ? `tel:+91${p}` : `tel:${p}`);
