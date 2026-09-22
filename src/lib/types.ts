/* ════════════════════════════════════════════════════════════════
   The owner app's domain, in one place.

   Every shape here mirrors a table in `migrations/002_app.sql`, so
   moving off the local JSON store onto Postgres is a rewrite of
   `store.ts` alone — nothing above it changes.
   ════════════════════════════════════════════════════════════════ */

import type { BhkKey } from "@/lib/cleaning";

export type Role = "owner" | "inspector" | "admin";

/* An inspector does not go from "applied" to "trusted with a key" in one
   step, and the app cannot pretend they do — the trial inspection needs
   app access *before* verification finishes, and the first five solo
   reports are read by a person before an owner ever sees them. */
export type InspectorStatus =
  | "applied"      // form in, nothing else yet — no app access
  | "screened"     // phone screen done
  | "interviewed"  // originals checked in person, police verification filed
  | "trial"        // app access, shadow and supervised jobs only
  | "probation"    // solo jobs, every report reviewed before it is published
  | "active"       // full access
  | "paused";      // rating below the bar, or a breach under review

export type User = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string;
  livesIn: string;
  createdAt: string;
  /** owners who have not finished the welcome flow still see it */
  onboardedAt: string | null;
  /** 1–10 for the launch cohort, null for everyone after them */
  foundingNo: number | null;
  /** the offer is one free inspection per owner, so it is spent once */
  freeVisitUsedAt: string | null;
};

export type PropertyKind = "home" | "plot" | "car";
export type HomeType = "Apartment" | "Villa" | "Independent house" | "Builder floor";

export type RoomKey = "bed" | "bath" | "living" | "kitchen" | "balcony" | "study" | "terrace" | "parking";

export type Property = {
  id: string;
  ownerId: string;
  kind: PropertyKind;
  label: string;
  address: string;
  locality: string;
  city: string;
  type: HomeType | "";
  size: BhkKey;
  rooms: Record<RoomKey, number>;
  /** what the inspector needs to get in and be expected */
  accessNote: string;
  keyHolderName: string;
  keyHolderPhone: string;
  /** which vector scene stands in for the cover photo */
  cover: "entrance" | "living" | "balcony" | "kitchen";
  createdAt: string;
  archivedAt: string | null;
};

export type SubStatus = "active" | "lapsed" | "cancelled";
export type Subscription = {
  id: string;
  ownerId: string;
  propertyId: string;
  planId: string;          // one-time | care | care-plus | plot-once
  visitsTotal: number;
  visitsUsed: number;
  amountInr: number;
  startedAt: string;
  renewsAt: string | null;
  status: SubStatus;
  /** Care+ repair cover consumed this plan year */
  coverUsedInr: number;
};

/* A visit walks this line, and every screen in the app reads from it. */
export type VisitStatus =
  | "scheduled"   // paid / confirmed, nobody assigned yet
  | "assigned"    // an inspector has it
  | "en_route"    // they are on the way
  | "on_site"     // checked in, walking the checklist
  | "submitted"   // checklist done, report being written
  | "ready"       // report published to the owner
  | "closed"      // owner has read it and acted on everything
  | "cancelled";

export type VisitKind = "inspection" | "cleaning" | "plot" | "car";

export type Visit = {
  id: string;
  ref: string;               // VIS-2026-0412 — what the owner quotes on a call
  ownerId: string;
  propertyId: string;
  kind: VisitKind;
  planId: string;
  /** cleaning tier when kind === "cleaning", or an add-on clean on an inspection */
  tierId: "refresh" | "deep" | "";
  addOns: Record<string, number>;
  scheduledFor: string;      // YYYY-MM-DD
  slot: string;              // "10:00 – 13:00"
  status: VisitStatus;
  inspectorId: string;
  amountInr: number;
  paid: boolean;
  liveCall: boolean;
  notes: string;
  /** booked against the launch offer: nothing charged, and repairs
      flagged on it carry no StillYours fee */
  founding: boolean;
  /** what the inspector earns for it — shown on the job board before
      they claim, because nobody should have to accept work blind */
  payoutInr: number;
  /** the owner's entry code. No OTP, no checklist — the inspectors'
      own declaration, enforced here rather than trusted */
  otp: string;
  claimedAt: string | null;
  checkIn: { at: string; lat: number; lng: number; distanceM: number; doorPhoto: Photo | null } | null;
  /** the working checklist, saved on every tap so a dropped signal
      never costs somebody a room they already walked */
  draft: DraftRoom[] | null;
  /** body camera rolling for the whole visit, when it was booked */
  recording: boolean;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  reportId: string | null;
};

export type ItemState = "pass" | "attn" | "fail";

/* What the inspector is filling in while they are standing in the room.
   Separate from ReportItem because a draft item has no verdict yet, and a
   report with an unanswered item must never be publishable. */
export type Photo = {
  id: string;
  /** a 320px JPEG data URL — the full-resolution original goes to object
      storage in production; this is what the local store can hold */
  thumb: string;
  at: string;
  lat: number | null;
  lng: number | null;
};
export type DraftItem = { t: string; s: ItemState | null; note: string; photos: Photo[] };
export type DraftRoom = {
  name: string;
  variant: "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living";
  items: DraftItem[];
  /** the room's video slot — the visit cannot be submitted with one empty */
  video: boolean;
};
export type ReportItem = { t: string; s: ItemState; note?: string };
export type ReportRoom = {
  name: string;
  variant: "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living";
  dur: string;
  items: ReportItem[];
};

export type Report = {
  id: string;
  ref: string;               // RPT-2026-0412
  visitId: string;
  propertyId: string;
  ownerId: string;
  score: number;
  counts: { pass: number; attn: number; fail: number };
  rooms: ReportRoom[];
  summary: string;
  inspectorId: string;
  /** the chain of custody the whole promise rests on */
  otpAt: string;
  onSite: string;
  gps: string;
  videos: string;
  publishedAt: string;
  readAt: string | null;
  /* An inspector on probation has every report read by a person before
     it reaches the owner. The report exists from the moment it is
     submitted; this is what keeps it out of the owner's app until then. */
  heldForReview: boolean;
};

export type Decision = "pending" | "approved" | "declined";
export type RepairStatus = "requested" | "assigned" | "in_progress" | "completed";

export type Issue = {
  id: string;
  ref: string;               // ISS-0917
  reportId: string;
  visitId: string;
  propertyId: string;
  ownerId: string;
  room: string;
  title: string;
  severity: ItemState;       // attn | fail
  body: string;
  variant: ReportRoom["variant"];
  quote: { labour: number; parts: number; fee: number; total: number; provider: string; trade: string } | null;
  /** what Care+ absorbs of the quote, computed when the issue is raised */
  coveredInr: number;
  decision: Decision;
  decidedAt: string | null;
  repair: {
    status: RepairStatus;
    providerName: string;
    trade: string;
    scheduledFor: string;
    completedAt: string | null;
    note: string;
  } | null;
};

export type Invoice = {
  id: string;
  ref: string;               // INV-2026-0031
  ownerId: string;
  propertyId: string;
  visitId: string | null;
  title: string;
  amountInr: number;
  status: "paid" | "due";
  method: string;
  createdAt: string;
};

/* One append-only stream. The property timeline, the notification bell and
   the "who decided what" audit are three readings of this same table. */
export type EventType =
  | "property.added" | "visit.booked" | "visit.assigned" | "visit.en_route"
  | "visit.started" | "visit.submitted" | "report.ready" | "issue.raised"
  | "issue.approved" | "issue.declined" | "repair.assigned" | "repair.completed"
  | "plan.started" | "invoice.paid" | "message";

export type Event = {
  id: string;
  ownerId: string;
  propertyId: string | null;
  visitId: string | null;
  type: EventType;
  title: string;
  body: string;
  href: string;
  at: string;
  /** shows in the bell until opened */
  readAt: string | null;
  /** an event the owner has to act on outranks one that is just news */
  action: boolean;
};

export type InspectorDoc = { name: string; ok: boolean; expiresAt: string | null };

export type Inspector = {
  id: string;
  /** set the moment they are given app access — this is what turns a
      phone number into a sign-in that lands on /field */
  userId: string | null;
  name: string;
  initials: string;
  phone: string;
  /** human summary, shown to owners */
  area: string;
  /** where they start their day, for the nearby sort */
  city: string;
  baseLocality: string;
  /** localities they will travel to — the job board is filtered by city,
      then sorted by distance from base */
  areas: string[];
  rating: number;
  visits: number;
  since: string;
  bg: string;
  verified: boolean;
  status: InspectorStatus;
  docs: InspectorDoc[];
  depositInr: number;
  availability: string[];
  /** how many of the five probation reports a person has already read */
  reviewedReports: number;
};

export type Session = { id: string; userId: string; createdAt: string; expiresAt: string };
export type Otp = { phone: string; code: string; expiresAt: string; attempts: number };

export type DB = {
  users: User[];
  properties: Property[];
  subscriptions: Subscription[];
  visits: Visit[];
  reports: Report[];
  issues: Issue[];
  invoices: Invoice[];
  events: Event[];
  inspectors: Inspector[];
  sessions: Session[];
  otps: Otp[];
};
