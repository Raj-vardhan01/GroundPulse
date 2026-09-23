/* ════════════════════════════════════════════════════════════════
   What a repair costs the owner — worked out once.

   The issue card used to add the 10% fee and print "Approve ₹X", while
   the bill for the same repair on a launch-offer visit left the fee
   off; and the Care+ cover was a number fixed when the quote was
   written, so two approvals could each take the same remaining cover.
   Now the card and the bill both call `repairBill`, with the plan as
   it stands at that moment.
   ════════════════════════════════════════════════════════════════ */

import { carePlusCover } from "@/lib/pricing";
import { effectiveStatus } from "@/lib/plans";
import type { Issue, Quote, Subscription } from "@/lib/types";

/** StillYours' flat fee on a repair, on labour and parts. */
export const FEE_RATE = 0.1;

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
  /** the fee actually charged — zero on a launch-offer visit */
  fee: number;
  /** the fee the launch offer took off, to show struck through */
  feeWaived: number;
  covered: number;
  payable: number;
};

/** The one place the owner's share of a repair is decided.
    Once approved, the cover is the number they approved — it does not
    move because the plan's remaining cover later did. */
export function repairBill(issue: Pick<Issue, "quote" | "decision" | "coveredInr" | "coverEligible">, opts: { founding: boolean; sub: Subscription | null }): RepairBill | null {
  const q = issue.quote;
  if (!q) return null;
  const fee = opts.founding ? 0 : q.fee;
  const covered = issue.decision === "approved" ? issue.coveredInr : coverFor(q, opts.sub, issue.coverEligible);
  return {
    labour: q.labour,
    parts: q.parts,
    fee,
    feeWaived: opts.founding ? q.fee : 0,
    covered,
    payable: Math.max(0, q.labour + q.parts + fee - covered),
  };
}
