/* ════════════════════════════════════════════════════════════════
   What a home of each size can hold, and what a room past it costs.

   The public access form and the owner app used to disagree: the app
   let a 1 BHK list ten bedrooms and still charged 1 BHK money for a
   70-item walk. One table now, read by both.

   Sizes 1–3 are capped at their layout. 4 BHK and up can grow, and
   every room past the size's own baseline is charged per inspection —
   a yearly plan pays it on each of its visits.
   ════════════════════════════════════════════════════════════════ */

import type { BhkKey } from "@/lib/cleaning";
import type { RoomKey } from "@/lib/types";

export const ROOM_KEYS: RoomKey[] = ["bed", "bath", "living", "kitchen", "balcony", "study", "terrace", "parking"];

/** label for the counter, name for one room of it, the smallest sensible
    number for a home, and the per-inspection rate past the baseline. */
export const ROOMS: Record<RoomKey, { label: string; one: string; min: number; rate: number }> = {
  bed: { label: "Bedrooms", one: "Bedroom", min: 1, rate: 200 },
  bath: { label: "Bathrooms", one: "Bathroom", min: 1, rate: 100 },
  living: { label: "Living / dining", one: "Living / dining", min: 1, rate: 150 },
  kitchen: { label: "Kitchen", one: "Kitchen", min: 1, rate: 150 },
  balcony: { label: "Balconies", one: "Balcony", min: 0, rate: 75 },
  study: { label: "Study / store", one: "Study / store", min: 0, rate: 100 },
  terrace: { label: "Terrace / garden", one: "Terrace / garden", min: 0, rate: 125 },
  parking: { label: "Parking spaces", one: "Parking", min: 0, rate: 75 },
};

type Band = "1" | "2" | "3" | "4";
const band = (s: BhkKey): Band => (s === "5" ? "4" : s);

/* The 2, 3 and 4 BHK+ rows are the public form's, unchanged. */
const CAPS: Record<Band, Record<RoomKey, number>> = {
  "1": { bed: 1, bath: 2, living: 1, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 },
  "2": { bed: 2, bath: 3, living: 2, kitchen: 1, balcony: 3, study: 1, terrace: 1, parking: 2 },
  "3": { bed: 3, bath: 4, living: 2, kitchen: 1, balcony: 4, study: 2, terrace: 1, parking: 2 },
  "4": { bed: 10, bath: 10, living: 7, kitchen: 5, balcony: 8, study: 5, terrace: 5, parking: 6 },
};

const DEFAULTS: Record<BhkKey, Record<RoomKey, number>> = {
  "1": { bed: 1, bath: 1, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 0 },
  "2": { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 1 },
  "3": { bed: 3, bath: 3, living: 1, kitchen: 1, balcony: 2, study: 0, terrace: 0, parking: 1 },
  "4": { bed: 4, bath: 4, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 },
  "5": { bed: 5, bath: 5, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 },
};

export const capFor = (size: BhkKey, k: RoomKey) => CAPS[band(size)][k];
export const defaultsFor = (size: BhkKey): Record<RoomKey, number> => ({ ...DEFAULTS[size] });

/** Keep a room count inside what the size allows. Anything the browser
    sends is put through this on the server. */
export function clampRooms(size: BhkKey, rooms: Partial<Record<RoomKey, number>>): Record<RoomKey, number> {
  return Object.fromEntries(
    ROOM_KEYS.map((k) => {
      const n = Math.round(Number(rooms[k] ?? 0)) || 0;
      return [k, Math.max(ROOMS[k].min, Math.min(capFor(size, k), n))];
    })
  ) as Record<RoomKey, number>;
}

/* Care+ carries more per room than Care or a one-off, because every extra
   room also falls under its repair cover. Rounded to ₹25. */
const planRateMult = (planId: string) => (planId === "care-plus" ? 1.5 : 1);
export const rateAt = (base: number, planId: string) => Math.round((base * planRateMult(planId)) / 25) * 25;

export type ExtraRoom = { k: RoomKey; one: string; n: number; rate: number; perVisit: number };

/** Rooms past this size's baseline, and what they add to one inspection.
    Only 4 BHK and up can have any — smaller sizes are capped at theirs. */
export function extraRooms(size: BhkKey, rooms: Record<RoomKey, number> | undefined, planId: string): ExtraRoom[] {
  if (!rooms || (size !== "4" && size !== "5")) return [];
  const base = DEFAULTS[size];
  return ROOM_KEYS.map((k) => ({ k, n: (rooms[k] ?? 0) - base[k] }))
    .filter((x) => x.n > 0)
    .map((x) => {
      const rate = rateAt(ROOMS[x.k].rate, planId);
      return { k: x.k, one: ROOMS[x.k].one, n: x.n, rate, perVisit: x.n * rate };
    });
}
