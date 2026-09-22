/* ════════════════════════════════════════════════════════════════
   "Nearby", without a geocoder.

   We have no mapping bill and no address-to-coordinate service, so
   distance is measured between locality centres rather than between
   doors. That is honest to about a kilometre, which is exactly the
   precision an inspector planning a day actually needs — the walk
   from the gate to the flat is not what decides the route.

   Wire a real geocoder later and only `coordsOf` changes.
   ════════════════════════════════════════════════════════════════ */

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
