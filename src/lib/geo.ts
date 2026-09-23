/* ════════════════════════════════════════════════════════════════
   "Nearby", and "were they really there".

   Two different precisions. Planning a day only needs to be honest to
   about a kilometre, so an inspector's base and any property nobody
   has pinned yet are measured from their locality's centre.

   Holding an inspector to a doorstep needs the doorstep. That is the
   property's pin — marked by the owner, or by the first inspector who
   got in with the owner's code — and nothing is ever judged against a
   locality centre: with no pin, a check-in is recorded, not measured.
   ════════════════════════════════════════════════════════════════ */

import type { Property, Visit } from "@/lib/types";

export type Point = { lat: number; lng: number };

/** Locality centres across Bengaluru, to four decimal places. */
export const LOCALITIES: Record<string, Point> = {
  "indiranagar": { lat: 12.9784, lng: 77.6408 },
  "koramangala": { lat: 12.9352, lng: 77.6245 },
  "hsr layout": { lat: 12.9116, lng: 77.6474 },
  "whitefield": { lat: 12.9698, lng: 77.7500 },
  "marathahalli": { lat: 12.9591, lng: 77.6974 },
  "jayanagar": { lat: 12.9250, lng: 77.5938 },
  "jp nagar": { lat: 12.9102, lng: 77.5850 },
  "basavanagudi": { lat: 12.9416, lng: 77.5750 },
  "malleshwaram": { lat: 13.0035, lng: 77.5709 },
  "rajajinagar": { lat: 12.9915, lng: 77.5550 },
  "yelahanka": { lat: 13.1007, lng: 77.5963 },
  "devanahalli": { lat: 13.2437, lng: 77.7118 },
  "hebbal": { lat: 13.0358, lng: 77.5970 },
  "banashankari": { lat: 12.9250, lng: 77.5468 },
  "electronic city": { lat: 12.8452, lng: 77.6602 },
  "sarjapur road": { lat: 12.9010, lng: 77.6870 },
  "bellandur": { lat: 12.9260, lng: 77.6762 },
  "rt nagar": { lat: 13.0206, lng: 77.5947 },
  "kengeri": { lat: 12.9080, lng: 77.4850 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
};

const key = (s: string) => s.trim().toLowerCase();

/** A locality's centre, falling back to the middle of the city. */
export function coordsOf(locality: string, city = "Bengaluru"): Point {
  return LOCALITIES[key(locality)] ?? LOCALITIES[key(city)] ?? LOCALITIES["bengaluru"];
}

const R = 6371; // km

/** Great-circle distance in kilometres. */
export function distanceKm(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);

/** Rough riding time across Bengaluru — 18 km/h door to door, which is
    what a two-wheeler actually averages here, plus five minutes to park
    and find the place. */
export const rideMinutes = (km: number) => Math.max(5, Math.round((km / 18) * 60) + 5);

export const fmtLatLng = (lat: number, lng: number) => `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

/* ── the property's own spot ─────────────────────────────────── */

/** Where a property is for planning: its pin, or its locality's centre. */
export const pointOf = (p: Pick<Property, "pin" | "locality" | "city">): Point =>
  p.pin ? { lat: p.pin.lat, lng: p.pin.lng } : coordsOf(p.locality, p.city);

/** Directions in the app the inspector already rides with — to the pin
    when there is one, to the written address when there is not. */
export function navigateHref(p: Pick<Property, "pin" | "address" | "city">) {
  const to = p.pin ? `${p.pin.lat},${p.pin.lng}` : `${p.address}, ${p.city}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}`;
}

/* ── the door ────────────────────────────────────────────────── */

/** Standing at the property. Indoors GPS drifts, so this is generous —
    it catches "I am checking in from home", not "wrong stairwell". */
export const CHECKIN_RADIUS_M = 500;
/** A phone that says "±40 m" may really be 40 m closer, and gets that
    benefit. One that says "±2 km" is not evidence of anything, so the
    benefit stops here. */
const MAX_SLACK_M = 100;
/** Sure enough of itself to become the pin when there was none. */
export const PIN_FROM_VISIT_MAX_ACCURACY_M = 75;

/** Too far from the pin to accept without a reason. Unknown is never too far. */
export const tooFar = (distanceM: number, accuracyM: number | null) =>
  distanceM >= 0 && distanceM - Math.min(accuracyM ?? 0, MAX_SLACK_M) > CHECKIN_RADIUS_M;

type CheckIn = NonNullable<Visit["checkIn"]>;

/** One description of a check-in for the owner's visit page, the report
    and the inspector's job — so it never says more in one place than
    the evidence holds in another. */
export function checkInWords(ci: Pick<CheckIn, "lat" | "lng" | "accuracyM" | "distanceM">) {
  if (ci.lat === null || ci.lng === null) return { short: "no GPS there", long: "no GPS there" };
  if (ci.distanceM < 0) return { short: "location recorded", long: "location recorded · no pin yet to measure it from" };
  const pm = ci.accuracyM !== null ? ` (±${Math.round(ci.accuracyM)} m)` : "";
  return { short: `${ci.distanceM} m from the pin`, long: `${ci.distanceM} m from the pin${pm}` };
}
