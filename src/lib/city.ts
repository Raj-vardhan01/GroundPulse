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

import { distanceKm, type Point } from "@/lib/geo";

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

/* ── how far an inspector goes ────────────────────────────────────
   The city itself, and 20 km past its edge — which is where most plots
   are. The edge is taken as a circle round the centre: Bengaluru is
   about 20 km from the centre to the outskirts in any direction, so a
   property is in reach when it says it is in the city, or when its pin
   is within 20 + 20 = 40 km of the centre. A property with no pin is
   judged by its city alone. */
export const CITY_RADIUS_KM = 20;
export const BEYOND_CITY_KM = 20;
const CENTRES: Record<string, Point> = { Bengaluru: { lat: 12.9716, lng: 77.5946 } };

export function inReach(p: { city: string; pin?: Pick<Point, "lat" | "lng"> | null }, city: string = HOME_CITY) {
  if (sameCity(p.city, city)) return true;
  const centre = CENTRES[normaliseCity(city)];
  if (!centre || !p.pin) return false;
  return distanceKm(p.pin, centre) <= CITY_RADIUS_KM + BEYOND_CITY_KM;
}

/** Can we send anybody there at all? */
export const inServiceArea = (p: { city: string; pin?: Pick<Point, "lat" | "lng"> | null }) =>
  SERVICE_CITIES.some((c) => inReach(p, c));
