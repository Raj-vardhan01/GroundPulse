/* ════════════════════════════════════════════════════════════════
   Repairs decided live, from the property.

   · The inspector flags something, prices it at Urban Company's rate and
     sends it to the owner there and then — and rings them to explain.
   · The owner has one hour to approve (by paying) or decline. The issue,
     its photos and its price are visible at once; the rest of the report
     waits for the report.
   · Only small jobs Urban Company has a slot for today are sent.
   · An approved repair is done on the same visit, with the inspector
     there. If it cannot be done that day — or the professional has not
     arrived within two hours of the approval — it is cancelled and what
     the owner paid is refunded in full, automatically. Nobody comes back
     another day for it. Any cancellation charge Urban Company makes is
     ours, never the owner's.
   · The visit only closes with the completion code. Anything still
     undecided then — or when its hour runs out — closes without a repair.

   Everything that writes runs inside `mutate`, on the store it is given.
   ════════════════════════════════════════════════════════════════ */

import { db, mutate, now, uid, issueRef } from "@/lib/store";
import { pushEvent } from "@/lib/events";
import { inr } from "@/lib/pricing";
import { coverFor, urbanCompanyQuote } from "@/lib/repair";
import { refundOwed } from "@/lib/refunds";
import type { DB, DraftItem, DraftRoom, Issue, Visit } from "@/lib/types";

export const DECIDE_MINUTES = 60;
/** How long the professional has to reach the property after an approval. */
export const PRO_WAIT_MINUTES = 120;
/** A payment started inside the hour is honoured even if it lands a moment after. */
const IN_FLIGHT_MS = 15 * 60_000;

export const isLive = (i: Pick<Issue, "sentAt">) => !!i.sentAt;
export const hourGone = (i: Pick<Issue, "decideBy">, t = Date.now()) => !!i.decideBy && t > Date.parse(i.decideBy);

/** Why a live issue can no longer be decided, or null. Only live issues
    are timed; one from a report is decided the old way. */
export function liveRefusal(d: Pick<DB, "visits">, iss: Pick<Issue, "sentAt" | "decideBy" | "visitId">): string | null {
  if (!isLive(iss)) return null;
  if (hourGone(iss)) return "The hour to decide on this has passed, so it is closed. Ask us from Help if you still want it done.";
  const v = d.visits.find((x) => x.id === iss.visitId);
  if (!v || v.status !== "on_site") return "The visit this came from has closed.";
  return null;
}

/** What is missing before an item can be sent to the owner, or null. */
export function notReadyToSend(item: DraftItem): string | null {
  if (item.issueId) return "Already sent to the owner.";
  if (item.s !== "attn" && item.s !== "fail") return "Mark it Attention or Fail first.";
  if (!item.photos.length && !item.videos.length) return "Add a photo or a clip — the owner decides from it.";
  if (item.note.trim().length < 8) return "Write a line about what you saw.";
  if (!item.quote || !item.quote.service || item.quote.price <= 0) return "Add the Urban Company price for the repair.";
  if (!item.quote.slotToday) return "Check Urban Company has a slot for it today, and tick the box. Bigger jobs stay on the report.";
  return null;
}

/** Turn a flagged item into a live question for the owner, with the clock started. */
export function sendLive(d: DB, v: Visit, room: DraftRoom, item: DraftItem): Issue {
  const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) ?? null : null;
  const firstOfPlan = !!sub && sub.startedByVisitId === v.id;
  const eligible = !firstOfPlan && !item.quote!.excluded;
  const q = urbanCompanyQuote(item.quote!.price, item.quote!.service, item.quote!.parts ?? 0);
  const t = now();
  const iss: Issue = {
    id: uid(), ref: issueRef(d), reportId: "", visitId: v.id, propertyId: v.propertyId, ownerId: v.ownerId,
    room: room.name, title: item.t, severity: item.s as "attn" | "fail", body: item.note, variant: room.variant,
    photos: item.photos, videos: item.videos,
    quote: q, quotedAt: t, coverEligible: eligible, coveredInr: coverFor(q, sub, eligible),
    decision: "pending", decidedAt: null, repair: null,
    sentAt: t, decideBy: new Date(Date.parse(t) + DECIDE_MINUTES * 60_000).toISOString(),
  };
  d.issues.push(iss);
  item.issueId = iss.id;
  const p = d.properties.find((x) => x.id === v.propertyId);
  pushEvent(d, {
    ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "issue.raised",
    title: `Decide within the hour: ${item.t}`,
    body: `${p?.label ?? "Your property"} · ${room.name} · ${inr(q.total)} — your inspector is still there and can do it today`,
    href: `/app/visits/${v.id}#live`, action: true,
  });
  return iss;
}

/** Close undecided live issues on a visit — its hour is up, or the visit closed. */
export function closeLive(d: DB, iss: Issue, why: "expired" | "visit_closed") {
  if (iss.decision !== "pending") return;
  iss.decision = "closed";
  iss.closedWhy = why;
  iss.decidedAt = now();
  pushEvent(d, {
    ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "issue.declined",
    title: why === "expired" ? "Closed — no decision within the hour" : "Closed with the visit",
    body: `${iss.title} · ${iss.ref} · nothing scheduled. It stays in your report; ask us from Help if you want it done.`,
    href: `/app/visits/${iss.visitId}`,
  });
}

/** Live issues whose hour has gone — unless a payment for one is on its way. */
function expiredNow(d: Pick<DB, "issues" | "payments">, t: number) {
  return d.issues.filter((i) => i.decision === "pending" && isLive(i) && hourGone(i, t) &&
    !d.payments.some((p) => p.purpose === "repair" && p.refId === i.id && p.status === "created" && Date.parse(p.createdAt) <= Date.parse(i.decideBy!) && t - Date.parse(p.createdAt) < IN_FLIGHT_MS));
}

/** Settle every expired hour. Reads first; writes only when it must. */
export async function sweepExpiredIssues() {
  const t = Date.now();
  if (!expiredNow(await db(), t).length) return;
  await mutate((d) => { for (const i of expiredNow(d, t)) closeLive(d, i, "expired"); });
}

/* ── an approved repair that does not happen ─────────────────────── */

/** By when the professional has to have arrived, for an approved live repair. */
export const proDueBy = (i: Pick<Issue, "decidedAt">) =>
  i.decidedAt ? Date.parse(i.decidedAt) + PRO_WAIT_MINUTES * 60_000 : 0;

const proLate = (i: Issue, t: number) =>
  !!i.sentAt && i.repair?.status === "in_progress" && !i.repair.proArrivedAt && !!i.decidedAt && t > proDueBy(i);

/** Cancel an approved live repair that could not be done on the visit:
    the cover goes back to the plan, and the bill is owed back in full —
    fee included. Nobody comes back another day for it. */
export function cancelLiveRepair(d: DB, iss: Issue, why: string) {
  const r = iss.repair;
  if (!r || r.status === "completed" || r.status === "cancelled") return;
  r.status = "cancelled";
  r.cancelledAt = now();
  r.note = why;
  const visit = d.visits.find((v) => v.id === iss.visitId);
  const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) : undefined;
  if (sub && iss.coveredInr) sub.coverUsedInr = Math.max(0, sub.coverUsedInr - iss.coveredInr);
  let back = 0;
  for (const inv of d.invoices.filter((x) => x.issueId === iss.id && x.status === "paid")) {
    inv.status = "refund_due";
    inv.method = `${inv.method} · could not be done on the visit — refunded in full`;
    back += inv.amountInr;
  }
  pushEvent(d, {
    ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.completed",
    title: "Could not be done today — cancelled and refunded",
    body: `${iss.title} · ${iss.ref} · ${why}${back ? ` · ${inr(back)} is on its way back to you` : ""}. It stays on your report; approve it again on a later visit if you like.`,
    href: `/app/visits/${iss.visitId}#live`, action: true,
  });
}

/** Everything live that has run out of time: an hour with no decision,
    or two hours with no professional. Reads first; writes only when it
    must — and sends back any money it owes. */
export async function sweepLive() {
  await sweepExpiredIssues();
  const t = Date.now();
  const late = (await db()).issues.filter((i) => proLate(i, t));
  if (!late.length) return;
  await mutate((d) => {
    for (const i of d.issues.filter((x) => proLate(x, t))) cancelLiveRepair(d, i, "the professional had not arrived within two hours");
  });
  for (const i of late) await refundOwed(i.ownerId, i.visitId);
}
