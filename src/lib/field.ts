/* ════════════════════════════════════════════════════════════════
   Everything the inspector app reads.

   Three rules shape all of it:

   1. An inspector sees the jobs in their own city and 20 km past it — and
      only the next two weeks of them. A plan books a year of visits in
      one go; a board full of dates three months out is noise.
   2. Up to five jobs claimed, three on any day, never two in one window —
      and only one under way at a time: a house is never half-walked for
      the next (lib/jobs). A report waiting on a reviewer is not in hand.
   3. The work happens on the day it was booked for. Not the day
      before because it suits, not after it quietly went past.
   ════════════════════════════════════════════════════════════════ */

import { db } from "@/lib/store";
import { coordsOf, distanceKm, pointOf, rideMinutes } from "@/lib/geo";
import { blocksFor, itemCount } from "@/lib/checklist";
import { inReach } from "@/lib/city";
import { claimRefusal, HELD, UNDER_WAY, windowEnd, windowStart } from "@/lib/jobs";
import { daysBetween, todayKey } from "@/lib/format";
import { reachOn } from "@/lib/phone";
import type { Inspector, InspectorStatus, Issue, Property, Visit } from "@/lib/types";

/** A job physically in hand — claimed, travelling, or being walked. */
export const LIVE: Visit["status"][] = ["assigned", "en_route", "on_site"];
/** Statuses that let somebody work at all. */
export const CAN_WORK: InspectorStatus[] = ["trial", "probation", "active"];
/** How far ahead the board looks. */
export const BOARD_DAYS = 14;

export type JobView = {
  visit: Visit;
  property: Property;
  ownerName: string;
  /** for the live call the owner asked for */
  ownerPhone: string;
  km: number;
  minutes: number;
  items: number;
  rooms: number;
};

export async function inspectorFor(userId: string): Promise<Inspector | null> {
  const d = await db();
  return d.inspectors.find((i) => i.userId === userId) ?? null;
}

async function view(v: Visit, from: { lat: number; lng: number }): Promise<JobView | null> {
  const d = await db();
  const property = d.properties.find((p) => p.id === v.propertyId);
  if (!property) return null;
  const owner = d.users.find((u) => u.id === v.ownerId);
  const km = distanceKm(from, pointOf(property));
  return {
    visit: v,
    property,
    ownerName: owner?.name || "Owner",
    ownerPhone: owner && !owner.deletedAt ? reachOn(owner) : "",
    km,
    minutes: rideMinutes(km),
    items: itemCount(property, v),
    rooms: blocksFor(property, v).length,
  };
}

/** Documents that have run out. An inspector with an expired police
    verification does not go into anybody's home until it is renewed. */
export function expiredDocs(ins: Inspector) {
  const today = todayKey();
  return ins.docs.filter((doc) => doc.expiresAt && doc.expiresAt < today);
}

/** Why this inspector cannot claim right now, or null if they can. */
export function claimBlock(ins: Inspector): string | null {
  if (!CAN_WORK.includes(ins.status)) return STATUS_COPY[ins.status].note;
  const expired = expiredDocs(ins);
  if (expired.length) return `Your ${expired.map((x) => x.name.toLowerCase()).join(", ")} has run out. Renew it with us before you take another job.`;
  return null;
}

/** Is this job on the board's window — today up to two weeks out, and
    not a window that has already closed? */
export const onBoardWindow = (v: Pick<Visit, "scheduledFor" | "slot">) => {
  const gap = daysBetween(todayKey(), v.scheduledFor);
  return gap >= 0 && gap <= BOARD_DAYS && Date.now() < windowEnd(v);
};

export type Sort = "near" | "soon" | "pay";

/** The board: unclaimed work in this inspector's city, next two weeks. */
export async function openJobs(ins: Inspector, sort: Sort = "near"): Promise<JobView[]> {
  const d = await db();
  const from = coordsOf(ins.baseLocality, ins.city);
  const mine = d.properties.filter((p) => inReach(p, ins.city));
  const ids = new Set(mine.map((p) => p.id));

  const open = d.visits.filter((v) => v.status === "scheduled" && !v.inspectorId && ids.has(v.propertyId) && onBoardWindow(v));
  const views = (await Promise.all(open.map((v) => view(v, from)))).filter(Boolean) as JobView[];

  const by: Record<Sort, (a: JobView, b: JobView) => number> = {
    near: (a, b) => a.km - b.km,
    soon: (a, b) => (a.visit.scheduledFor < b.visit.scheduledFor ? -1 : 1),
    pay: (a, b) => b.visit.payoutInr - a.visit.payoutInr,
  };
  return views.sort(by[sort]);
}

/** Every job in their hands — the one under way first, then by day and window. */
export async function heldJobs(ins: Inspector): Promise<JobView[]> {
  const d = await db();
  const mine = d.visits
    .filter((x) => x.inspectorId === ins.id && HELD.includes(x.status))
    .sort((a, b) => Number(UNDER_WAY.includes(b.status)) - Number(UNDER_WAY.includes(a.status)) || windowStart(a) - windowStart(b));
  const from = coordsOf(ins.baseLocality, ins.city);
  return (await Promise.all(mine.map((v) => view(v, from)))).filter(Boolean) as JobView[];
}

/** Why they cannot claim this one, or null. */
export async function claimCheck(ins: Inspector, visitId: string) {
  const d = await db();
  const v = d.visits.find((x) => x.id === visitId);
  return v ? claimRefusal(d, ins, v) : "This job is no longer on the board.";
}

/** Reports of theirs a reviewer has not read yet. */
export async function inReview(ins: Inspector) {
  const d = await db();
  return d.visits.filter((v) => v.inspectorId === ins.id && v.status === "submitted");
}

export async function jobView(ins: Inspector, id: string): Promise<JobView | null> {
  const d = await db();
  const v = d.visits.find((x) => x.id === id);
  if (!v) return null;
  /* Readable if it is on the open board in their city, or already theirs. */
  const property = d.properties.find((p) => p.id === v.propertyId);
  if (!property) return null;
  const isMine = v.inspectorId === ins.id;
  const onBoard = inReach(property, ins.city) && v.status === "scheduled" && !v.inspectorId && onBoardWindow(v);
  if (!isMine && !onBoard) return null;
  return view(v, coordsOf(ins.baseLocality, ins.city));
}

/** Everything they have finished, newest first. */
export async function doneJobs(ins: Inspector) {
  const d = await db();
  return d.visits
    .filter((v) => v.inspectorId === ins.id && ["ready", "closed", "submitted"].includes(v.status))
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
}

/* ── repairs ───────────────────────────────────────────────────
   A repair the owner approved is witnessed by the inspector who found
   it: they know the house, they know the spot, and their before-photo
   is the one the after-photo has to match. It reaches them once the
   owner has picked the day. */

export type RepairJob = { issue: Issue; property: Property; visitRef: string; due: boolean; done: boolean };

function repairView(d: Awaited<ReturnType<typeof db>>, iss: Issue): RepairJob | null {
  const property = d.properties.find((p) => p.id === iss.propertyId);
  const visit = d.visits.find((v) => v.id === iss.visitId);
  if (!property || !visit || !iss.repair) return null;
  return {
    issue: iss, property, visitRef: visit.ref,
    due: !!iss.repair.scheduledFor && iss.repair.scheduledFor <= todayKey(),
    done: iss.repair.status === "completed",
  };
}

const foundBy = (d: Awaited<ReturnType<typeof db>>, ins: Inspector, iss: Issue) =>
  d.visits.some((v) => v.id === iss.visitId && v.inspectorId === ins.id);

/** Repairs waiting on this inspector's after-photo, soonest first. */
export async function repairJobs(ins: Inspector): Promise<RepairJob[]> {
  const d = await db();
  return d.issues
    .filter((i) => i.repair && i.repair.scheduledFor && i.repair.status !== "completed" && foundBy(d, ins, i))
    .sort((a, b) => (a.repair!.scheduledFor < b.repair!.scheduledFor ? -1 : 1))
    .map((i) => repairView(d, i))
    .filter((j): j is RepairJob => j !== null);
}

/** One repair, open or finished — only ever for the inspector who found it. */
export async function repairJob(ins: Inspector, issueId: string): Promise<RepairJob | null> {
  const d = await db();
  const iss = d.issues.find((i) => i.id === issueId);
  if (!iss?.repair || !foundBy(d, ins, iss)) return null;
  return repairView(d, iss);
}

/* Paid the same day: whatever was walked today reaches their UPI by the
   end of today. The visit happens on the day it was booked for, so that
   day is the one it is paid on. */
export async function earnings(ins: Inspector) {
  const d = await db();
  const mine = d.visits.filter((v) => v.inspectorId === ins.id && ["submitted", "ready", "closed"].includes(v.status));
  const today = todayKey();
  const pay = (v: Visit) => v.payoutInr + (v.overtimeInr ?? 0);
  /* what reaches their UPI — less what went to the deposit */
  const sum = (rows: Visit[]) => rows.reduce((n, v) => n + pay(v) - (v.depositHeldInr ?? 0), 0);
  return {
    today: sum(mine.filter((v) => v.scheduledFor === today)),
    paidOut: sum(mine.filter((v) => v.scheduledFor < today)),
    overtime: mine.reduce((n, v) => n + (v.overtimeInr ?? 0), 0),
    lifetime: sum(mine),
    visits: mine.length,
    rows: [...mine].sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1)),
    pay,
  };
}

/** Where a person is in the gauntlet, in words rather than a code. */
export const STATUS_COPY: Record<InspectorStatus, { label: string; tone: "pass" | "warn" | "fail" | ""; note: string }> = {
  applied: { label: "Applied", tone: "", note: "We have your application. The phone screen comes first — expect a call." },
  screened: { label: "Phone screen done", tone: "", note: "Next is the in-person interview in Bengaluru, with your original documents." },
  interviewed: { label: "Documents verified", tone: "warn", note: "Your police verification is filed. Nobody visits a home on a pending verification — this is the wait." },
  trial: { label: "Trial", tone: "warn", note: "You can open jobs marked for a supervised trial. Your reports do not reach owners yet." },
  probation: { label: "Probation", tone: "warn", note: "You take solo jobs, and a person reads every report before the owner sees it — for your first five." },
  active: { label: "Active", tone: "pass", note: "Full access. Your reports go straight to the owner when you submit them." },
  paused: { label: "Paused", tone: "fail", note: "Your account is on hold. We will call you — nothing is decided until we have spoken." },
};
