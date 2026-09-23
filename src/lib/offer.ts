/* ════════════════════════════════════════════════════════════════
   The launch offer, in one place.

   `FoundingOffer.tsx` states the terms on the public site; this file
   is what the owner app enforces, so the price a founding owner sees
   at checkout is the price the site promised them.

   When ten owners have booked: set LIMIT to 0 here and delete the
   marketing component. Nothing else needs touching — every screen
   reads `eligible()`.
   ════════════════════════════════════════════════════════════════ */

import type { BhkKey } from "@/lib/cleaning";
import type { User, Property, VisitKind } from "@/lib/types";
import { sameCity } from "@/lib/city";

export const LIMIT = 10;

/** Homes up to 2 BHK in Bengaluru, and the visit has to be a single
    inspection — not a yearly plan, not a clean, not a plot walk. */
export const SIZES: BhkKey[] = ["1", "2"];
export const CITY = "Bengaluru";
export const FREE_PLAN = "one-time";

export const terms = [
  "One free inspection per owner — not one per visit",
  "Homes up to 2 BHK, in Bengaluru",
  "The full 42-item check, photos and video of every room, report within the hour",
  "The whole visit recorded on a body camera, start to finish — and you get the full video",
  "Any repair you approve is at the professional's cost, with no StillYours fee",
  "No card needed. It never turns into a paid plan unless you choose one",
];

/** Is this owner in the founding cohort, and have they still got their
    free visit? Numbers are handed out at sign-up, in order. */
export const hasFreeVisit = (u: Pick<User, "foundingNo" | "freeVisitUsedAt">) =>
  u.foundingNo !== null && u.foundingNo <= LIMIT && !u.freeVisitUsedAt;

/** …and does the booking in front of them actually qualify? */
export function eligible(
  u: Pick<User, "foundingNo" | "freeVisitUsedAt">,
  p: Pick<Property, "kind" | "size" | "city"> | undefined,
  kind: VisitKind,
  planId: string
) {
  if (!hasFreeVisit(u) || !p) return false;
  return kind === "inspection" && planId === FREE_PLAN && qualifies(p);
}

/** Is this property the kind the free inspection covers? */
export const qualifies = (p: Pick<Property, "kind" | "size" | "city">) =>
  p.kind === "home" && SIZES.includes(p.size) && sameCity(p.city, CITY);

/** Why a founding owner's booking does not qualify — said plainly, so
    nobody has to guess which of the terms caught them. */
export function blockedBecause(
  p: Pick<Property, "kind" | "size" | "city"> | undefined,
  kind: VisitKind,
  planId: string
): string | null {
  if (!p) return null;
  if (p.kind !== "home") return "The free inspection covers homes — a plot visit is charged normally.";
  if (!SIZES.includes(p.size)) return "The free inspection covers homes up to 2 BHK. This one is larger, so it is charged normally.";
  if (!sameCity(p.city, CITY)) return `The free inspection is ${CITY} only for now.`;
  if (kind === "cleaning") return "Cleaning is not part of the free inspection.";
  if (kind !== "inspection" || planId !== FREE_PLAN) return "Your free visit is a one-time inspection. Pick that and it costs nothing.";
  return null;
}
