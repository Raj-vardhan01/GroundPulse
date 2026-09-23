/* ════════════════════════════════════════════════════════════════
   What a repair costs the owner — worked out once.

   The issue card used to add the fee and print "Approve ₹X", while
   the bill for the same repair on a launch-offer visit left the fee
   off; and the Care+ cover was a number fixed when the quote was
   written, so two approvals could each take the same remaining cover.
   Now the card and the bill both call `repairBill`, with the plan as
   it stands at that moment.
   ════════════════════════════════════════════════════════════════ */

import { carePlusCover } from "@/lib/pricing";
import { effectiveStatus } from "@/lib/plans";
import type { Issue, Quote, Subscription } from "@/lib/types";

/** StillYours' fee on a repair, on top of the price of the work. */
export const FEE_RATE = 0.15;

/** The inspector's quote: what Urban Company charges for this service
    today (the work — labour), plus any parts at their rate card, plus our
    fee. Kept apart so Care+ can cover labour in full and parts only up to
    its per-repair limit, exactly as the terms say. */
export function urbanCompanyQuote(price: number, service: string, parts = 0): Quote {
  return { ...makeQuote(price, parts, "Urban Company", service.trim().slice(0, 80)), source: "urban-company" };
}

export function makeQuote(labour: number, parts: number, provider: string, trade: string): Quote {
  const l = Math.max(0, Math.round(labour));
  const p = Math.max(0, Math.round(parts));
  const fee = Math.round((l + p) * FEE_RATE);
  return { labour: l, parts: p, fee, total: l + p + fee, provider, trade };
}

/** What Care+ absorbs of a quote, under the printed terms: labour in
    full, parts up to the per-repair limit, never more than the per-repair
    cap or what is left of the year's cover. The fee is not covered. */
export function coverFor(q: Quote | null, sub: Subscription | null, eligible: boolean) {
  if (!q || !sub || !eligible || sub.planId !== "care-plus") return 0;
  if (effectiveStatus(sub) !== "active") return 0;
  const coverable = q.labour + Math.min(q.parts, carePlusCover.partsPerIncident);
  const left = Math.max(0, carePlusCover.yearly - sub.coverUsedInr);
  return Math.max(0, Math.min(coverable, carePlusCover.perIncident, left));
}

export type RepairBill = {
  labour: number;
  parts: number;
  /** the fee actually charged — zero on a launch-offer visit, and zero on
      a repair Care+ is covering */
  fee: number;
  /** the fee the launch offer took off, to show struck through */
  feeWaived: number;
  /** the fee Care+ took off — "repairs inside the cover carry no fee" */
  feeCovered: number;
  covered: number;
  payable: number;
};

/** The one place the owner's share of a repair is decided.
    Once approved, the cover is the number they approved — it does not
    move because the plan's remaining cover later did. */
export function repairBill(issue: Pick<Issue, "quote" | "decision" | "coveredInr" | "coverEligible">, opts: { founding: boolean; sub: Subscription | null }): RepairBill | null {
  const q = issue.quote;
  if (!q) return null;
  const covered = issue.decision === "approved" ? issue.coveredInr : coverFor(q, opts.sub, issue.coverEligible);
  /* No fee on a repair the cover is paying for — including the part of it
     that runs past the cover (the terms' own example: parts ₹9,000 +
     labour ₹1,500, we pay ₹8,500, you pay ₹2,000). A repair the cover
     does not touch — excluded, first-visit, or the year's cover spent —
     carries the fee like any other. */
  const underCover = covered > 0;
  const fee = opts.founding || underCover ? 0 : q.fee;
  return {
    labour: q.labour,
    parts: q.parts,
    fee,
    feeWaived: opts.founding && !underCover ? q.fee : 0,
    feeCovered: underCover ? q.fee : 0,
    covered,
    payable: Math.max(0, q.labour + q.parts + fee - covered),
  };
}
