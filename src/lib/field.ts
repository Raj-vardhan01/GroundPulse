/* ════════════════════════════════════════════════════════════════
   Everything the inspector app reads.

   Two rules shape all of it:

   1. An inspector sees the jobs in their own city, nothing else. Not
      a national feed they have to filter down — the board opens on
      work they could actually reach today.
   2. One live job at a time. Claiming a second while the first is
      unfinished is how a house gets half-walked, so the board tells
      them why the button is off rather than hiding it.
   ════════════════════════════════════════════════════════════════ */

import { db } from "@/lib/store";
import { coordsOf, distanceKm, rideMinutes } from "@/lib/geo";
import { blocksFor, itemCount } from "@/lib/checklist";
import type { Inspector, InspectorStatus, Property, Visit } from "@/lib/types";

/** Statuses that mean "this job is still on my plate". */
export const LIVE: Visit["status"][] = ["assigned", "en_route", "on_site", "submitted"];
/** Statuses that let somebody work at all. */
export const CAN_WORK: InspectorStatus[] = ["trial", "probation", "active"];

export type JobView = {
  visit: Visit;
  property: Property;
  ownerName: string;
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
  const km = distanceKm(from, coordsOf(property.locality, property.city));
  return {
    visit: v,
    property,
    ownerName: d.users.find((u) => u.id === v.ownerId)?.name ?? "Owner",
    km,
    minutes: rideMinutes(km),
    items: itemCount(property),
    rooms: blocksFor(property).length,
  };
}

export type Sort = "near" | "soon" | "pay";

/** The board: unclaimed work in this inspector's city. */
export async function openJobs(ins: Inspector, sort: Sort = "near"): Promise<JobView[]> {
  const d = await db();
  const from = coordsOf(ins.baseLocality, ins.city);
  const mine = d.properties.filter((p) => p.city.trim().toLowerCase() === ins.city.trim().toLowerCase());
  const ids = new Set(mine.map((p) => p.id));

  const open = d.visits.filter((v) => v.status === "scheduled" && !v.inspectorId && ids.has(v.propertyId));
  const views = (await Promise.all(open.map((v) => view(v, from)))).filter(Boolean) as JobView[];

  const by: Record<Sort, (a: JobView, b: JobView) => number> = {
    near: (a, b) => a.km - b.km,
    soon: (a, b) => (a.visit.scheduledFor < b.visit.scheduledFor ? -1 : 1),
    pay: (a, b) => b.visit.payoutInr - a.visit.payoutInr,
  };
  return views.sort(by[sort]);
}

/** The one job they are holding, if any. */
export async function liveJob(ins: Inspector): Promise<JobView | null> {
  const d = await db();
  const v = d.visits.find((x) => x.inspectorId === ins.id && LIVE.includes(x.status));
  if (!v) return null;
  return view(v, coordsOf(ins.baseLocality, ins.city));
}

export async function jobView(ins: Inspector, id: string): Promise<JobView | null> {
  const d = await db();
  const v = d.visits.find((x) => x.id === id);
  if (!v) return null;
  /* Readable if it is on the open board in their city, or already theirs. */
  const property = d.properties.find((p) => p.id === v.propertyId);
  if (!property) return null;
  const sameCity = property.city.trim().toLowerCase() === ins.city.trim().toLowerCase();
  const isMine = v.inspectorId === ins.id;
  if (!isMine && !(sameCity && v.status === "scheduled" && !v.inspectorId)) return null;
  return view(v, coordsOf(ins.baseLocality, ins.city));
}

/** Everything they have finished, newest first. */
export async function doneJobs(ins: Inspector) {
  const d = await db();
  return d.visits
    .filter((v) => v.inspectorId === ins.id && ["ready", "closed", "submitted"].includes(v.status))
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
}

export async function earnings(ins: Inspector) {
  const d = await db();
  const done = d.visits.filter((v) => v.inspectorId === ins.id && ["ready", "closed"].includes(v.status));
  const pending = d.visits.filter((v) => v.inspectorId === ins.id && v.status === "submitted");
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const sum = (rows: Visit[]) => rows.reduce((n, v) => n + v.payoutInr, 0);
  return {
    settled: sum(done.filter((v) => new Date(v.scheduledFor) < weekStart)),
    thisWeek: sum(done.filter((v) => new Date(v.scheduledFor) >= weekStart)),
    awaiting: sum(pending),
    lifetime: sum(done) + sum(pending),
    visits: done.length,
    rows: [...done, ...pending].sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1)),
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
