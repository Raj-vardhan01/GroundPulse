/* ════════════════════════════════════════════════════════════════
   One price calculator, used by the booking screen to show the total
   live and by the server action that stores it. Two implementations
   would eventually disagree, and the number the owner saw has to be
   the number they are charged.

   Every rate here comes from `pricing.ts` and `cleaning.ts` — the
   same numbers the public pages print. Nothing is re-typed.
   ════════════════════════════════════════════════════════════════ */

import { plans, plotPlans, addOns, inr } from "@/lib/pricing";
import { tiers, visitPrice, type BhkKey } from "@/lib/cleaning";
import type { VisitKind } from "@/lib/types";

export { inr };

export type QuoteInput = {
  kind: VisitKind;
  planId: string;
  size: BhkKey;
  tierId: "refresh" | "deep" | "";
  addOns: Record<string, number>;
  /** the launch offer applies to this booking — see `lib/offer.ts` */
  founding?: boolean;
};

export type Line = { k: string; note: string; v: number; was?: number };
export type Quote = { lines: Line[]; total: number; recurring: boolean; period: string; saved: number };

const allPlans = [...plans, ...plotPlans];
const tier = (id: string) => tiers.find((t) => t.id === id);

/** A plan's price at the size of this home. 1–2 BHK pay the headline
    rate, 3 BHK the middle one, 4 BHK and up the top one. */
export function planPriceAt(planId: string, size: BhkKey) {
  const p = allPlans.find((x) => x.id === planId);
  if (!p) return 0;
  if (p.id === "one-time") return visitPrice[size];
  if (size === "3") return p.price3 ?? p.price;
  if (size === "4" || size === "5") return p.price4 ?? p.price3 ?? p.price;
  return p.price;
}

export function quote(q: QuoteInput): Quote {
  const lines: Line[] = [];
  const plan = allPlans.find((p) => p.id === q.planId);

  if (q.kind === "cleaning") {
    const t = tier(q.tierId || "refresh")!;
    lines.push({ k: t.name, note: `${t.hours[q.size]} · crew of ${t.crew[q.size]} · inspector on site`, v: t.price[q.size] });
  } else if (q.kind === "plot") {
    lines.push({ k: "Plot visit", note: "Boundary walk, GPS photos, encroachment check", v: plotPlans[0].price });
  } else {
    const price = planPriceAt(q.planId, q.size);
    const visitsNote = plan?.visits && plan.visits > 1 ? `${plan.visits} inspections a year` : "one verified inspector visit";
    /* The launch offer does not discount the visit, it removes the
       charge — so the old price stays on the line, struck through, and
       the owner can see exactly what they are not paying. */
    lines.push(
      q.founding
        ? { k: plan?.name ?? "Inspection", note: "free — your launch-offer inspection", v: 0, was: price }
        : { k: plan?.name ?? "Inspection", note: visitsNote, v: price }
    );

    /* A clean booked onto a visit an inspector is already making costs
       the rider price, not the standalone one. */
    for (const id of ["cleaning", "deep"] as const) {
      const n = q.addOns[id] ?? 0;
      if (!n) continue;
      const t = tier(id === "cleaning" ? "refresh" : "deep")!;
      lines.push({ k: `${t.name} ×${n}`, note: `added to a visit you are already booking · ${t.hours[q.size]}`, v: t.rider[q.size] * n });
    }
  }

  if (q.addOns.camera) {
    const a = addOns.find((x) => x.id === "camera")!;
    lines.push(
      q.founding
        ? { k: a.name, note: "free on your launch-offer inspection", v: 0, was: a.price }
        : { k: a.name, note: a.note, v: a.price }
    );
  }

  const cars = q.addOns.car ?? 0;
  if (cars) {
    const a = addOns.find((x) => x.id === "car")!;
    lines.push({ k: `Car inspection ×${cars}`, note: a.note, v: a.price * cars });
  }

  const total = lines.reduce((n, l) => n + l.v, 0);
  const saved = lines.reduce((n, l) => n + ((l.was ?? l.v) - l.v), 0);
  const recurring = (plan?.visits ?? 1) > 1 && q.kind === "inspection";
  return { lines, total, saved, recurring, period: recurring ? "per year" : "one visit" };
}

/* Slots an inspector can actually be given. Deliberately wide — the
   site promises a person for as long as it takes, not a 30-minute
   window nobody can keep. */
export const SLOTS = ["07:00 – 10:00", "10:00 – 13:00", "13:00 – 16:00", "16:00 – 19:00"];
