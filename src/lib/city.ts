/* ════════════════════════════════════════════════════════════════
   One spelling per city.

   The job board matches a property to an inspector by city. When the
   city was free text, an Indiranagar flat saved as "Bangalore" never
   reached anybody's board — no inspector could claim it — and it lost
   the launch offer too, while the owner was billed all the same. So
   every city is normalised on the way in and compared normalised, and
   a city we do not cover yet is said out loud at booking instead of
   turning into a visit nobody will ever take.
   ════════════════════════════════════════════════════════════════ */

/** Where we have verified inspectors today. */
export const SERVICE_CITIES = ["Bengaluru"] as const;
export const HOME_CITY = SERVICE_CITIES[0];

const ALIASES: Record<string, string> = {
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
  banglore: "Bengaluru",
  bangaluru: "Bengaluru",
  bengalooru: "Bengaluru",
  blr: "Bengaluru",
  "bengaluru urban": "Bengaluru",
  "bangalore urban": "Bengaluru",
  "bengaluru rural": "Bengaluru",
  "bangalore rural": "Bengaluru",
  "bengaluru city": "Bengaluru",
  "bangalore city": "Bengaluru",
};

const titleCase = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** "bangalore " → "Bengaluru"; anything we do not know is tidied, not guessed. */
export function normaliseCity(raw: string) {
  const k = raw.toLowerCase().replace(/[^\p{L} ]/gu, " ").replace(/\s+/g, " ").trim();
  if (!k) return "";
  return ALIASES[k] ?? titleCase(raw);
}

export const sameCity = (a: string, b: string) => !!a && normaliseCity(a) === normaliseCity(b);

export const isServiced = (city: string) => (SERVICE_CITIES as readonly string[]).includes(normaliseCity(city));
