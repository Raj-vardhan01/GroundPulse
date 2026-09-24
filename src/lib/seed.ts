/* ════════════════════════════════════════════════════════════════
   The demo accounts.

   A brand-new sign-in starts empty and is walked through adding a
   property — but an empty app shows none of what this product
   actually is. So the store ships with an owner who has been on the
   service a while, inspectors at different stages, and an ops seat
   with real work waiting in its queues:

   · +91 90000 00000  Priya — a report with decisions waiting, one of
                      them still waiting on a quote; a plot being walked
                      right now; a plan with its rhythm booked
   · +91 90000 00001  Ravi — active inspector, one job claimed
   · +91 90000 00002  Meena — probation; her last report is held
   · +91 90000 00003  Arun — on site right now, mid-checklist
   · +91 90000 00099  ops — the console at /ops
   ════════════════════════════════════════════════════════════════ */

import type { DB, Pin, Property, ReportRoom, Event, EventType, Visit, VisitKind, DraftRoom, ItemState, User, Line } from "@/lib/types";
import { blocksFor, countItems, scoreOf } from "@/lib/checklist";
import { payoutFor } from "@/lib/payout";
import { makeQuote } from "@/lib/repair";
import { STORE_VERSION } from "@/lib/storeVersion";
import { addDays, fmtDayDate, todayKey } from "@/lib/format";

/** A moment `days` from now, at hh:mm in Bengaluru. */
const at = (days: number, hh = 10, mm = 0) =>
  new Date(`${addDays(todayKey(), days)}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+05:30`).toISOString();
/** A Bengaluru day, `days` from today. */
const dateOf = (days: number) => addDays(todayKey(), days);
/** Earlier today, never in the future — the demo is opened at any hour. */
const earlierToday = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

const OWNER = "usr_demo";

const person = (u: Partial<User> & Pick<User, "id" | "role" | "name" | "phone">): User => ({
  email: "", livesIn: "", tz: "Asia/Kolkata", prefs: { sms: true, email: true },
  createdAt: at(-200), onboardedAt: at(-200), foundingNo: null, freeVisitUsedAt: null, deletedAt: null,
  ...u,
});

/** The person on the ops side — releases held reports, puts quotes on
    flagged issues, moves repairs along. Sign in as +91 90000 00099. */
export const opsUser = (): User => person({
  id: "usr_ops", role: "admin", name: "StillYours ops", phone: "9000000099", email: "ops@stillyours.in",
  livesIn: "HSR Layout, Bengaluru", createdAt: at(-400), onboardedAt: at(-400),
});

const property = (p: Partial<Property> & Pick<Property, "id" | "label" | "address">): Property => ({
  ownerId: OWNER,
  kind: "home",
  locality: "",
  city: "Bengaluru",
  type: "Apartment",
  size: "2",
  rooms: { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 1 },
  accessNote: "",
  keyHolderName: "",
  keyHolderPhone: "",
  cover: "entrance",
  pin: null,
  createdAt: at(-240),
  archivedAt: null,
  ...p,
} as Property);

/** A spot the owner marked on the map when they added the place. */
const marked = (lat: number, lng: number, days: number): Pin => ({ lat, lng, accuracyM: null, source: "map", at: at(days), confirmedAt: at(days) });

const indira = property({
  id: "prp_indira",
  label: "Ancestral Apartment",
  address: "C-14, 100 Ft Road, Indiranagar",
  locality: "Indiranagar",
  type: "Apartment",
  size: "2",
  accessNote: "Lift to 3rd floor. Security desk needs the OTP before they let anyone up — gate closes 21:00.",
  keyHolderName: "Lakshmi (neighbour, C-13)",
  keyHolderPhone: "+91 98450 11223",
  cover: "entrance",
  pin: marked(12.9788, 77.6407, -240),
});

const villa = property({
  id: "prp_villa",
  label: "Garden Villa",
  address: "22, 3rd Cross, Palm Meadows, Whitefield",
  locality: "Whitefield",
  type: "Villa",
  size: "4",
  rooms: { bed: 4, bath: 4, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 },
  accessNote: "Side gate key with the gardener. Dogs in the next plot bark — they are not ours.",
  keyHolderName: "Mani (gardener)",
  keyHolderPhone: "+91 99001 44556",
  cover: "living",
  pin: marked(12.9701, 77.7503, -120),
  createdAt: at(-120),
});

const plot = property({
  id: "prp_plot",
  label: "Village Plot",
  kind: "plot",
  address: "Survey 114/2, Chikkajala, Devanahalli",
  locality: "Devanahalli",
  type: "",
  size: "1",
  rooms: { bed: 0, bath: 0, living: 0, kitchen: 0, balcony: 0, study: 0, terrace: 0, parking: 0 },
  accessNote: "Take the mud road past the borewell. Red survey stone at the north-east corner is the reference.",
  keyHolderName: "",
  keyHolderPhone: "",
  cover: "balcony",
  /* nobody knew the exact spot — Arun marked it at the gate this morning */
  pin: { lat: 13.2440, lng: 77.7121, accuracyM: 18, source: "inspector", at: earlierToday(1), confirmedAt: null },
  createdAt: at(-60),
});

/* ── other owners ─────────────────────────────────────────────────
   The job board would be a very short list with one customer on it.
   These two exist so an inspector opening /field sees a real morning:
   work spread across the city, at different distances. */
const OWNER2 = "usr_vikram";
const OWNER3 = "usr_anita";

const boardProps: Property[] = [
  property({ id: "prp_kora", ownerId: OWNER2, label: "Koramangala flat", address: "302, 5th Block, Koramangala", locality: "Koramangala", type: "Apartment", size: "3", rooms: { bed: 3, bath: 3, living: 1, kitchen: 1, balcony: 2, study: 0, terrace: 0, parking: 1 }, accessNote: "Watchman has the spare. Lift is on the left.", keyHolderName: "Security desk", keyHolderPhone: "+91 99860 33221", cover: "living", pin: marked(12.9356, 77.6244, -240) }),
  property({ id: "prp_white", ownerId: OWNER2, label: "Whitefield villa", address: "14, Prestige Ozone, Whitefield", locality: "Whitefield", type: "Villa", size: "4", rooms: { bed: 4, bath: 4, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 }, accessNote: "Clubhouse gate, not the main one. Say which villa at the boom barrier.", keyHolderName: "Estate office", keyHolderPhone: "+91 80456 77110", cover: "entrance", pin: marked(12.9695, 77.7497, -240) }),
  property({ id: "prp_jaya", ownerId: OWNER3, label: "Amma's house", address: "78, 9th Main, Jayanagar 4th Block", locality: "Jayanagar", type: "Independent house", size: "2", rooms: { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 1, parking: 1 }, accessNote: "Blue gate. The dog next door barks but does not come out.", keyHolderName: "Sudha (next door)", keyHolderPhone: "+91 98860 22110", cover: "entrance", pin: marked(12.9253, 77.5934, -240) }),
  property({ id: "prp_hsr", ownerId: OWNER3, label: "HSR rental", address: "B-7, 27th Main, HSR Layout Sector 2", locality: "HSR Layout", type: "Builder floor", size: "2", rooms: { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 1 }, accessNote: "Tenant moved out last week. Meter box is outside, to the right of the door.", keyHolderName: "", keyHolderPhone: "", cover: "living" }),
  property({ id: "prp_yela", ownerId: OWNER2, label: "Yelahanka plot", kind: "plot", address: "Site 41, Attur Layout, Yelahanka", locality: "Yelahanka", type: "", size: "1", rooms: { bed: 0, bath: 0, living: 0, kitchen: 0, balcony: 0, study: 0, terrace: 0, parking: 0 }, accessNote: "Corner site, opposite the water tank. Survey stones are painted white.", keyHolderName: "", keyHolderPhone: "", cover: "balcony" }),
  property({ id: "prp_malle", ownerId: OWNER3, label: "Malleshwaram flat", address: "5, 8th Cross, Malleshwaram", locality: "Malleshwaram", type: "Apartment", size: "1", rooms: { bed: 1, bath: 1, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 0 }, accessNote: "Third floor, no lift. Keys with the ground-floor tenant.", keyHolderName: "Mr. Rao (ground floor)", keyHolderPhone: "+91 99001 88220", cover: "living" }),
];

/* A half-walked checklist, so the live plot visit opens where an
   inspector would actually find it: two areas done, two to go. */
function partialDraft(p: Property, done: number): DraftRoom[] {
  return blocksFor(p).map((b, i) => ({
    name: b.name,
    variant: b.variant,
    video: null,
    items: b.items.map((t, j) => ({
      t,
      s: i < done ? ((i === 1 && j === 1 ? "attn" : "pass") as ItemState) : null,
      note: i === 1 && j === 1 ? "Someone has tipped building rubble over the north line. Roughly a truckload, and it was not here in the last photos." : "",
      photos: [],
      videos: [],
    })),
  }));
}

/* Every visit needs two dozen fields that are the same on almost all of
   them. Spelling those out a dozen times buries the few that differ. */
type VisitSeed = Partial<Visit> & Pick<Visit, "id" | "ref" | "propertyId"> & { property: Property };
const visit = ({ property, ...v }: VisitSeed): Visit => {
  const kind: VisitKind = v.kind ?? "inspection";
  const addOns = v.addOns ?? {};
  const out = {
    ownerId: property.ownerId,
    kind,
    planId: "one-time",
    tierId: "",
    addOns,
    scheduledFor: dateOf(3),
    slot: "10:00 – 13:00",
    status: "scheduled",
    inspectorId: "",
    amountInr: 0,
    paid: false,
    liveCall: false,
    notes: "",
    founding: false,
    subscriptionId: null,
    usesPlan: false,
    planClean: false,
    planService: "",
    lines: [],
    payoutInr: payoutFor(property, kind, addOns),
    otp: String(1000 + (property.id.charCodeAt(4) * 7 + (v.ref?.charCodeAt(9) ?? 3) * 13) % 9000),
    otpTries: 0,
    claimedAt: null,
    checkIn: null,
    draft: null,
    recording: !!addOns.camera,
    rating: null,
    createdAt: at(-3),
    cancelledAt: null,
    startedAt: null,
    endedAt: null,
    reportId: null,
    advanceInr: 0,
    overtimeInr: 0,
    ...v,
  } as Visit;
  /* work before today was paid on its day, as the earnings page says */
  if (["submitted", "ready", "closed"].includes(out.status) && out.scheduledFor < dateOf(0)) out.payoutSentAt ??= out.endedAt ?? out.createdAt;
  return out;
};

const planLine = (name: string, note = "included in your plan"): Line => ({ k: `${name} inspection`, note, v: 0 });
const oneTime = (price: number): Line => ({ k: "One-time visit", note: "one verified inspector visit", v: price });

/* Clip lengths are made up, but not identical — a real walkthrough spends
   longer in a bathroom than on a balcony. Derived from the room name so the
   same room always reads the same length. */
const clip = (name: string, items: number) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const secs = 26 + items * 12 + (h % 23);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

/** All-pass rooms for a property, then the named items are knocked down. */
function roomsFor(p: Property, marks: Record<string, { s: "attn" | "fail"; note: string }>): ReportRoom[] {
  return blocksFor(p).map((b) => ({
    name: b.name,
    variant: b.variant,
    dur: clip(b.name, b.items.length),
    items: b.items.map((t) => {
      const m = marks[`${b.name} · ${t}`];
      return m ? { t, s: m.s, note: m.note } : { t, s: "pass" as const };
    }),
  }));
}

/** What production starts from: nobody, nothing booked. Real inspectors
    and the ops seat come from the roster, not from here. */
export function emptyStore(): DB {
  return {
    version: STORE_VERSION,
    users: [], properties: [], subscriptions: [], visits: [], reports: [], issues: [],
    invoices: [], events: [], inspectors: [], tickets: [], sessions: [], otps: [], payments: [],
  };
}

/** The demo — everywhere except production, and there only with DEMO_DATA=1. */
export const demoData = () => process.env.NODE_ENV !== "production" || process.env.DEMO_DATA === "1";

export function seed(): DB {
  const indiraRooms = roomsFor(indira, {
    "Bathroom 1 · Sink & plumbing": { s: "fail", note: "Slow drip from the trap under the sink. Cabinet base damp with early swelling." },
    "Bedroom 1 · Window locks": { s: "attn", note: "Right-hand latch does not seat fully. Closes, but does not lock." },
    "Balcony · Drainage": { s: "attn", note: "Outlet half blocked with leaf litter. Cleared on site; will silt again by monsoon." },
  });
  const indiraCounts = countItems(indiraRooms);

  const villaRooms = roomsFor(villa, {
    "Kitchen · Pest & mould signs": { s: "attn", note: "Droppings behind the lower cabinet. No active nest found." },
    "Terrace / garden · Waterproofing & pooling": { s: "fail", note: "Water standing 4–5 cm at the north parapet two days after rain." },
    "Bathroom 3 · Seepage & tiles": { s: "attn", note: "Grout darkened along the shower corner — early, not yet through the wall." },
    "Electrical & mains · Visible wiring & rodent damage": { s: "attn", note: "Sleeve chewed on the garage run. Taped on site, needs replacing." },
  });
  const villaCounts = countItems(villaRooms);

  /* Meena's last visit — written, submitted, and waiting for a person to
     read it before Vikram can see it. It is what the ops review queue opens on. */
  const koraRooms = roomsFor(boardProps[0], {
    "Bathroom 3 · Taps & geyser": { s: "fail", note: "Geyser trips the MCB within a minute of switching on. Isolated it at the board." },
    "Kitchen · Pest & mould signs": { s: "attn", note: "Cockroach droppings in the sink cabinet. Nothing live seen." },
  });
  const koraCounts = countItems(koraRooms);

  const ev = (type: EventType, title: string, body: string, days: number, extra: Partial<Event> = {}): Event => ({
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    ownerId: OWNER,
    propertyId: null,
    visitId: null,
    type,
    title,
    body,
    href: "/app",
    at: at(days, 14, 20),
    readAt: at(days, 15),
    action: false,
    ...extra,
  });

  return {
    version: STORE_VERSION,
    users: [
      /* Founding owner number one, who went straight onto a plan and never
         claimed the free inspection — so the launch offer is live in this
         account, and only the 2 BHK in Bengaluru qualifies for it. */
      person({
        id: OWNER, role: "owner", name: "Priya Sharma", phone: "9000000000", email: "priya@example.in",
        livesIn: "Dubai, UAE", tz: "Asia/Dubai", createdAt: at(-240), onboardedAt: at(-240), foundingNo: 1,
      }),
      person({ id: OWNER2, role: "owner", name: "Vikram Rao", phone: "9000000011", email: "vikram@example.in", livesIn: "Singapore", tz: "Asia/Singapore", createdAt: at(-150), onboardedAt: at(-150), foundingNo: 2, freeVisitUsedAt: at(-140) }),
      person({ id: OWNER3, role: "owner", name: "Anita Nair", phone: "9000000012", email: "anita@example.in", livesIn: "London, UK", tz: "Europe/London", createdAt: at(-95), onboardedAt: at(-95), foundingNo: 3, freeVisitUsedAt: at(-90) }),

      /* Verified inspectors. Their number is their sign-in, exactly like an
         owner's — the role on this row is what sends them to /field. */
      person({ id: "usr_ravi", role: "inspector", name: "Ravi K.", phone: "9000000001", email: "ravi@example.in", livesIn: "Marathahalli, Bengaluru", createdAt: at(-620), onboardedAt: at(-620) }),
      person({ id: "usr_meena", role: "inspector", name: "Meena S.", phone: "9000000002", email: "meena@example.in", livesIn: "HSR Layout, Bengaluru", createdAt: at(-240), onboardedAt: at(-240) }),
      person({ id: "usr_arun", role: "inspector", name: "Arun P.", phone: "9000000003", email: "arun@example.in", livesIn: "Yelahanka, Bengaluru", createdAt: at(-200), onboardedAt: at(-200) }),

      opsUser(),
    ],

    properties: [indira, villa, plot, ...boardProps],

    subscriptions: [
      /* Three of four inspections taken: one before these records, last
         week's, and next week's. Both refresh cleans are booked. */
      {
        id: "sub_indira", ownerId: OWNER, propertyId: "prp_indira", planId: "care",
        visitsTotal: 4, visitsUsed: 3, cleansTotal: 2, cleansUsed: 2, servicesTotal: 0, servicesUsed: 0,
        amountInr: 7999, startedAt: at(-240), renewsAt: dateOf(125), status: "active", autoRenew: true,
        startedByVisitId: null, coverUsedInr: 0,
      },
      {
        id: "sub_villa", ownerId: OWNER, propertyId: "prp_villa", planId: "care-plus",
        visitsTotal: 4, visitsUsed: 2, cleansTotal: 2, cleansUsed: 0, servicesTotal: 2, servicesUsed: 0,
        amountInr: 24999, startedAt: at(-120), renewsAt: dateOf(245), status: "active", autoRenew: true,
        startedByVisitId: null, coverUsedInr: 3300,
      },
    ],

    visits: [
      /* ── Priya's history ─────────────────────────────────────── */
      /* delivered last week — the report with decisions still waiting */
      visit({ id: "vis_indira_2", ref: "VIS-2026-0411", property: indira, propertyId: indira.id, kind: "inspection", planId: "care", addOns: { cleaning: 1 }, scheduledFor: dateOf(-6), slot: "13:00 – 16:00", status: "ready", inspectorId: "ins_ravi", paid: true, subscriptionId: "sub_indira", usesPlan: true, planClean: true, lines: [planLine("Care"), { k: "Refresh clean", note: "included in your plan · inspector on site", v: 0, was: 999 }], createdAt: at(-20), startedAt: at(-6, 13, 2), endedAt: at(-6, 14, 11), reportId: "rep_indira_2", claimedAt: at(-9), checkIn: { at: at(-6, 13, 2), lat: 12.9786, lng: 77.6405, accuracyM: 12, distanceM: 31, doorPhoto: null, note: "" } }),
      /* the villa's first visit — issue approved, repair closed */
      visit({ id: "vis_villa_1", ref: "VIS-2026-0388", property: villa, propertyId: villa.id, kind: "inspection", planId: "care-plus", scheduledFor: dateOf(-38), slot: "10:00 – 13:00", status: "closed", inspectorId: "ins_meena", paid: true, liveCall: true, subscriptionId: "sub_villa", usesPlan: true, lines: [planLine("Care+")], rating: { stars: 5, note: "Called me from the terrace and showed me the pooling. Exactly what I needed.", at: at(-37, 9) }, createdAt: at(-50), startedAt: at(-38, 10, 5), endedAt: at(-38, 12, 1), reportId: "rep_villa_1", claimedAt: at(-42), checkIn: { at: at(-38, 10, 5), lat: 12.9699, lng: 77.7502, accuracyM: 9, distanceM: 25, doorPhoto: null, note: "" } }),
      /* happening right now — Arun is on site, mid-checklist */
      visit({ id: "vis_plot_1", ref: "VIS-2026-0414", property: plot, propertyId: plot.id, kind: "plot", planId: "plot-once", scheduledFor: dateOf(0), slot: "07:00 – 10:00", status: "on_site", inspectorId: "ins_arun", amountInr: 1999, lines: [{ k: "Plot visit", note: "Boundary walk, GPS photos, encroachment check", v: 1999 }], notes: "Please photograph the north-east stone first.", createdAt: at(-4), startedAt: earlierToday(1), claimedAt: at(-2), otp: "4417", checkIn: { at: earlierToday(1), lat: 13.2440, lng: 77.7121, accuracyM: 18, distanceM: -1, doorPhoto: null, note: "" }, draft: partialDraft(plot, 2) }),
      /* next week, Ravi has already claimed it — the plan's third inspection,
         with the second included clean */
      visit({ id: "vis_indira_3", ref: "VIS-2026-0419", property: indira, propertyId: indira.id, kind: "inspection", planId: "care", addOns: { cleaning: 1 }, scheduledFor: dateOf(8), slot: "10:00 – 13:00", status: "assigned", inspectorId: "ins_ravi", liveCall: true, subscriptionId: "sub_indira", usesPlan: true, planClean: true, lines: [planLine("Care", "included in your plan · 1 of 4 left after this"), { k: "Refresh clean", note: "included in your plan · inspector on site", v: 0, was: 999 }], createdAt: at(-2), claimedAt: at(-1) }),
      /* the villa's rhythm — the next quarterly inspection, booked by the plan */
      visit({ id: "vis_villa_2", ref: "VIS-2026-0420", property: villa, propertyId: villa.id, kind: "inspection", planId: "care-plus", scheduledFor: dateOf(53), slot: "10:00 – 13:00", subscriptionId: "sub_villa", usesPlan: true, lines: [planLine("Care+", "included in your plan · booked for you")], createdAt: at(-38) }),

      /* ── Meena's held report, for Vikram ─────────────────────── */
      visit({ id: "vis_kora_0", ref: "VIS-2026-0418", property: boardProps[0], propertyId: "prp_kora", kind: "inspection", planId: "one-time", scheduledFor: dateOf(-1), slot: "10:00 – 13:00", status: "submitted", inspectorId: "ins_meena", amountInr: 2499, lines: [oneTime(2499)], createdAt: at(-6), claimedAt: at(-3), startedAt: at(-1, 10, 12), endedAt: at(-1, 11, 40), reportId: "rep_kora_0", checkIn: { at: at(-1, 10, 12), lat: 12.9354, lng: 77.6243, accuracyM: 15, distanceM: 25, doorPhoto: null, note: "" } }),

      /* ── the open board: nobody has claimed these yet ─────────── */
      visit({ id: "job_kora", ref: "VIS-2026-0421", property: boardProps[0], propertyId: "prp_kora", kind: "inspection", planId: "one-time", scheduledFor: dateOf(1), slot: "10:00 – 13:00", amountInr: 2499, lines: [oneTime(2499)], notes: "Third bathroom geyser was making a noise last time.", createdAt: at(-1) }),
      visit({ id: "job_jaya", ref: "VIS-2026-0422", property: boardProps[2], propertyId: "prp_jaya", kind: "inspection", planId: "one-time", addOns: { camera: 1 }, scheduledFor: dateOf(1), slot: "13:00 – 16:00", amountInr: 2499, lines: [oneTime(1999), { k: "Full-visit video recording", note: "Body camera for the whole visit", v: 500 }], notes: "Amma's house. Please be gentle with the wooden almirah doors — just photograph them shut.", createdAt: at(-1), liveCall: true }),
      visit({ id: "job_hsr", ref: "VIS-2026-0423", property: boardProps[3], propertyId: "prp_hsr", kind: "inspection", planId: "one-time", scheduledFor: dateOf(2), slot: "07:00 – 10:00", amountInr: 1999, lines: [oneTime(1999)], notes: "Tenant just moved out — I need to know what they broke before I return the deposit.", createdAt: at(-1) }),
      visit({ id: "job_white", ref: "VIS-2026-0424", property: boardProps[1], propertyId: "prp_white", kind: "cleaning", planId: "cleaning", tierId: "deep", scheduledFor: dateOf(2), slot: "10:00 – 13:00", amountInr: 7999, lines: [{ k: "Deep clean", note: "7–8 hrs · crew of 3 cleaners · inspector on site", v: 7999 }], notes: "Crew is booked. You stay with them the whole time.", createdAt: at(-2) }),
      visit({ id: "job_yela", ref: "VIS-2026-0425", property: boardProps[4], propertyId: "prp_yela", kind: "plot", planId: "plot-once", scheduledFor: dateOf(3), slot: "07:00 – 10:00", amountInr: 1999, lines: [{ k: "Plot visit", note: "Boundary walk, GPS photos, encroachment check", v: 1999 }], notes: "Somebody dumped construction debris on the north edge last month. Check if it has grown.", createdAt: at(-2) }),
      visit({ id: "job_malle", ref: "VIS-2026-0426", property: boardProps[5], propertyId: "prp_malle", kind: "inspection", planId: "one-time", addOns: { car: 1 }, scheduledFor: dateOf(4), slot: "16:00 – 19:00", amountInr: 2199, lines: [oneTime(1499), { k: "Car inspection", note: "Start & idle, battery, tyres, leaks, odometer photo", v: 700 }], notes: "Car in the basement has not been started since March.", createdAt: at(-1) }),
      visit({ id: "job_kora2", ref: "VIS-2026-0427", property: boardProps[0], propertyId: "prp_kora", kind: "inspection", planId: "one-time", addOns: { cleaning: 1, camera: 1 }, scheduledFor: dateOf(6), slot: "13:00 – 16:00", amountInr: 3998, lines: [oneTime(2499), { k: "Refresh clean", note: "added to a visit you are already booking", v: 999 }, { k: "Full-visit video recording", note: "Body camera for the whole visit", v: 500 }], createdAt: at(0) }),
    ],

    reports: [
      {
        id: "rep_indira_2", ref: "RPT-2026-0411", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        score: scoreOf(indiraCounts), counts: indiraCounts, rooms: indiraRooms,
        summary: "The house is in good order for a place that has been shut five months. One thing needs a decision — a slow leak under the first bathroom sink that is already swelling the cabinet base. The window latch and the balcony drain are small and can wait for the next visit if you would rather.",
        inspectorId: "ins_ravi", otpAt: "13:02", onSite: "13:02 → 14:11 (1h 09m)", gps: "12.9786° N, 77.6405° E", videos: "",
        doorPhoto: null, publishedAt: at(-6, 14, 49), readAt: null, heldForReview: false, reviewedAt: null, shareToken: null,
      },
      {
        id: "rep_villa_1", ref: "RPT-2026-0388", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        score: scoreOf(villaCounts), counts: villaCounts, rooms: villaRooms,
        summary: "Terrace waterproofing is the real problem here — water is standing two days after rain and the parapet wall will start taking it. Everything else is maintenance: a chewed cable sleeve in the garage run and early grout darkening in the third bathroom.",
        inspectorId: "ins_meena", otpAt: "10:05", onSite: "10:05 → 12:01 (1h 56m)", gps: "12.9699° N, 77.7502° E", videos: "",
        doorPhoto: null, publishedAt: at(-38, 12, 44), readAt: at(-37, 8, 12), heldForReview: false, reviewedAt: at(-38, 12, 40), shareToken: null,
      },
      {
        id: "rep_kora_0", ref: "RPT-2026-0418", visitId: "vis_kora_0", propertyId: "prp_kora", ownerId: OWNER2,
        score: scoreOf(koraCounts), counts: koraCounts, rooms: koraRooms,
        summary: "Flat is dry and secure. The third bathroom geyser trips the MCB as soon as it heats — I isolated it at the board so it is safe, but it needs an electrician before anyone uses it. Some cockroach droppings in the kitchen sink cabinet, nothing live.",
        inspectorId: "ins_meena", otpAt: "10:12", onSite: "10:12 → 11:40 (1h 28m)", gps: "12.9354° N, 77.6243° E", videos: "",
        doorPhoto: null, publishedAt: at(-1, 11, 41), readAt: null, heldForReview: true, reviewedAt: null, shareToken: null,
      },
    ],

    issues: [
      {
        id: "iss_leak", ref: "ISS-0917", reportId: "rep_indira_2", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        room: "Bathroom 1", title: "Water leakage under the sink", severity: "fail", variant: "bathroom", photos: [], videos: [],
        body: "Slow drip from the trap under the sink. Cabinet base is damp with early swelling. Recommend replacing the trap and sealing the joint before the board goes.",
        quote: makeQuote(1800, 1200, "Suresh M.", "Plumbing"), quotedAt: at(-5, 11),
        coverEligible: true, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      {
        id: "iss_latch", ref: "ISS-0918", reportId: "rep_indira_2", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        room: "Bedroom 1", title: "Window latch does not seat", severity: "attn", variant: "bedroom", photos: [], videos: [],
        body: "Right-hand latch does not seat fully. The window closes but does not lock — worth fixing before the house is left shut again.",
        quote: makeQuote(600, 250, "Suresh M.", "Carpentry"), quotedAt: at(-5, 11),
        coverEligible: true, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      /* still with ops — nobody has priced it yet, so the owner can only
         decline it, not approve it */
      {
        id: "iss_drain", ref: "ISS-0919", reportId: "rep_indira_2", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        room: "Balcony", title: "Balcony drain half blocked", severity: "attn", variant: "balcony", photos: [], videos: [],
        body: "Outlet half blocked with leaf litter. Cleared what I could on site; it will silt up again before the monsoon without a proper grating.",
        quote: null, quotedAt: null, coverEligible: true, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      {
        id: "iss_terrace", ref: "ISS-0902", reportId: "rep_villa_1", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        room: "Terrace / garden", title: "Water standing at the north parapet", severity: "fail", variant: "balcony", photos: [], videos: [],
        body: "Water standing 4–5 cm two days after rain. The slope is wrong at the north end and the parapet joint is already darkening.",
        quote: makeQuote(2400, 900, "Karan V.", "Waterproofing"), quotedAt: at(-38, 16),
        coverEligible: true, coveredInr: 3300, decision: "approved", decidedAt: at(-37, 9, 2),
        repair: { status: "completed", providerName: "Karan V.", trade: "Waterproofing", scheduledFor: dateOf(-30), slot: "10:00 – 13:00", completedAt: at(-30, 15, 40), note: "Re-laid slope at the north 1.8 m, new drain mouth, joint sealed. Flooded and watched 30 min — clears in under 4.", afterPhoto: null, afterVideo: null },
      },
      {
        id: "iss_wiring", ref: "ISS-0903", reportId: "rep_villa_1", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        room: "Electrical & mains", title: "Chewed cable sleeve, garage run", severity: "attn", variant: "electrical", photos: [], videos: [],
        body: "Sleeve chewed through on the garage run. Taped on site so it is safe, but the run should be replaced rather than patched.",
        quote: makeQuote(900, 600, "Karan V.", "Electrical"), quotedAt: at(-38, 16),
        coverEligible: true, coveredInr: 1500, decision: "declined", decidedAt: at(-37, 9, 5), repair: null,
      },
      /* Meena's findings — invisible to Vikram until the report is released */
      {
        id: "iss_geyser", ref: "ISS-0920", reportId: "rep_kora_0", visitId: "vis_kora_0", propertyId: "prp_kora", ownerId: OWNER2,
        room: "Bathroom 3", title: "Geyser trips the MCB", severity: "fail", variant: "bathroom", photos: [], videos: [],
        body: "Geyser trips the MCB within a minute of switching on. Isolated it at the board so it is safe — needs an electrician before anyone uses it.",
        quote: null, quotedAt: null, coverEligible: true, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      {
        id: "iss_roach", ref: "ISS-0921", reportId: "rep_kora_0", visitId: "vis_kora_0", propertyId: "prp_kora", ownerId: OWNER2,
        room: "Kitchen", title: "Cockroach droppings in the sink cabinet", severity: "attn", variant: "kitchen", photos: [], videos: [],
        body: "Droppings in the sink cabinet. Nothing live seen — a gel treatment before it gets established would do it.",
        quote: null, quotedAt: null, coverEligible: true, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
    ],

    /* Bills are raised when a visit has happened or a repair is approved —
       never before. */
    invoices: [
      { id: "inv_1", ref: "INV-2026-0028", ownerId: OWNER, propertyId: "prp_villa", visitId: "vis_villa_1", issueId: null, subscriptionId: "sub_villa", title: "Care+ · Garden Villa · one year", amountInr: 24999, status: "paid", method: "UPI · HDFC", createdAt: at(-38, 12, 44) },
      { id: "inv_2", ref: "INV-2026-0029", ownerId: OWNER, propertyId: "prp_villa", visitId: "vis_villa_1", issueId: "iss_terrace", subscriptionId: "sub_villa", title: "Water standing at the north parapet · ISS-0902", amountInr: 330, status: "paid", method: "Care+ covers ₹3,300", createdAt: at(-37, 9, 2) },
    ],

    events: [
      ev("report.ready", "Your report is ready", "Ancestral Apartment · health " + scoreOf(indiraCounts) + " · 3 things flagged — quotes on the way", -6, { propertyId: "prp_indira", visitId: "vis_indira_2", href: "/app/reports/rep_indira_2", readAt: null, action: true }),
      ev("issue.quoted", "A quote is ready — your decision", "Water leakage under the sink · Ancestral Apartment · ₹3,300", -5, { propertyId: "prp_indira", visitId: "vis_indira_2", href: "/app/reports/rep_indira_2#iss_leak", readAt: null, action: true }),
      ev("visit.started", "Arun P. is on site", "Village Plot · boundary walk in progress", 0, { propertyId: "prp_plot", visitId: "vis_plot_1", href: "/app/visits/vis_plot_1", readAt: null, at: earlierToday(1) }),
      ev("property.pinned", "Is this where Village Plot is?", "Arun P. marked the spot at the gate. Check it — every visit is measured from it.", 0, { propertyId: "prp_plot", visitId: "vis_plot_1", href: "/app/properties/prp_plot", readAt: null, at: earlierToday(1) }),
      ev("visit.assigned", "Ravi K. is assigned", `Ancestral Apartment · ${fmtDayDate(dateOf(8))} · 10:00 – 13:00`, -1, { propertyId: "prp_indira", visitId: "vis_indira_3", href: "/app/visits/vis_indira_3" }),
      ev("repair.completed", "Repair completed", "Garden Villa · terrace waterproofing · Karan V.", -30, { propertyId: "prp_villa", href: "/app/reports/rep_villa_1#iss_terrace" }),
      ev("issue.approved", "You approved a repair", "Garden Villa · ISS-0902 · you pay ₹330, Care+ covers ₹3,300", -37, { propertyId: "prp_villa", href: "/app/reports/rep_villa_1" }),
      ev("report.ready", "Your report is ready", "Garden Villa · health " + scoreOf(villaCounts) + " · 4 things flagged", -38, { propertyId: "prp_villa", visitId: "vis_villa_1", href: "/app/reports/rep_villa_1" }),
      ev("plan.started", "Care+ has started", "Garden Villa · 4 inspections a year · repairs covered to ₹20,000", -38, { propertyId: "prp_villa", href: "/app/plan" }),
      ev("property.added", "Ancestral Apartment added", "C-14, 100 Ft Road, Indiranagar", -240, { propertyId: "prp_indira", href: "/app/properties/prp_indira" }),
    ],

    inspectors: [
      {
        id: "ins_ravi", userId: "usr_ravi", name: "Ravi K.", initials: "RK", phone: "9000000001",
        area: "Whitefield · Marathahalli · Indiranagar", city: "Bengaluru", baseLocality: "Marathahalli",
        areas: ["Marathahalli", "Whitefield", "Indiranagar", "Bellandur", "Koramangala", "HSR Layout"],
        rating: 4.9, visits: 212, since: "2024", bg: "Ex-facility supervisor, 11 yrs",
        verified: true, status: "active", depositInr: 1500, reviewedReports: 5, upiId: "ravi.k@okaxis",
        availability: ["Weekday mornings", "Weekday afternoons", "Saturdays"],
        docs: [
          { name: "Aadhaar card", ok: true, expiresAt: null },
          { name: "PAN card", ok: true, expiresAt: null },
          { name: "Permanent address proof", ok: true, expiresAt: null },
          { name: "Police verification certificate", ok: true, expiresAt: dateOf(210) },
          { name: "Passport photograph", ok: true, expiresAt: null },
          { name: "Bank account / UPI", ok: true, expiresAt: null },
          { name: "Two references, both called", ok: true, expiresAt: null },
        ],
      },
      {
        id: "ins_meena", userId: "usr_meena", name: "Meena S.", initials: "MS", phone: "9000000002",
        area: "Koramangala · HSR", city: "Bengaluru", baseLocality: "HSR Layout",
        areas: ["HSR Layout", "Koramangala", "Sarjapur Road", "Bellandur", "Jayanagar"],
        rating: 5.0, visits: 148, since: "2025", bg: "Ex-bank operations, 8 yrs",
        verified: true, status: "probation", depositInr: 1500, reviewedReports: 3, upiId: "meena.s@oksbi",
        availability: ["Weekday mornings", "Weekday evenings", "Sundays"],
        docs: [
          { name: "Aadhaar card", ok: true, expiresAt: null },
          { name: "PAN card", ok: true, expiresAt: null },
          { name: "Permanent address proof", ok: true, expiresAt: null },
          { name: "Police verification certificate", ok: true, expiresAt: dateOf(95) },
          { name: "Passport photograph", ok: true, expiresAt: null },
          { name: "Bank account / UPI", ok: true, expiresAt: null },
          { name: "Two references, both called", ok: true, expiresAt: null },
        ],
      },
      {
        id: "ins_arun", userId: "usr_arun", name: "Arun P.", initials: "AP", phone: "9000000003",
        area: "Yelahanka · Devanahalli", city: "Bengaluru", baseLocality: "Yelahanka",
        areas: ["Yelahanka", "Devanahalli", "Hebbal", "RT Nagar", "Malleshwaram"],
        rating: 4.8, visits: 96, since: "2025", bg: "Ex-Army JCO, plots & land",
        verified: true, status: "active", depositInr: 1500, reviewedReports: 5, upiId: "arun.p@okicici",
        availability: ["Weekday mornings", "Saturdays", "Sundays"],
        docs: [
          { name: "Aadhaar card", ok: true, expiresAt: null },
          { name: "PAN card", ok: true, expiresAt: null },
          { name: "Permanent address proof", ok: true, expiresAt: null },
          { name: "Police verification certificate", ok: true, expiresAt: dateOf(40) },
          { name: "Passport photograph", ok: true, expiresAt: null },
          { name: "Bank account / UPI", ok: true, expiresAt: null },
          { name: "Two references, both called", ok: true, expiresAt: null },
        ],
      },
    ],

    tickets: [],
    sessions: [],
    otps: [],
    payments: [],
  };
}

