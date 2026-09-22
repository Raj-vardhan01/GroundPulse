/* ════════════════════════════════════════════════════════════════
   The demo account.

   A brand-new sign-in starts empty and is walked through adding a
   property — but an empty app shows none of what this product
   actually is. So the store ships with one owner who has been on the
   service a while: a delivered report with a decision waiting, a
   visit happening right now, a repair already closed out.

   Sign in as +91 90000 00000 to land in it.
   ════════════════════════════════════════════════════════════════ */

import type { DB, Property, ReportRoom, Event, EventType, Visit, VisitKind, DraftRoom, ItemState } from "@/lib/types";
import { blocksFor, countItems, scoreOf } from "@/lib/checklist";
import { payoutFor } from "@/lib/payout";

const DAY = 86_400_000;
const at = (days: number, hh = 10, mm = 0) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};
const dateOf = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

const OWNER = "usr_demo";

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
  createdAt: at(-240),
  archivedAt: null,
  ...p,
} as Property);

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
  createdAt: at(-60),
});

/* ── other owners ─────────────────────────────────────────────────
   The job board would be a very short list with one customer on it.
   These two exist so an inspector opening /field sees a real morning:
   work spread across the city, at different distances. */
const OWNER2 = "usr_vikram";
const OWNER3 = "usr_anita";

const boardProps: Property[] = [
  property({ id: "prp_kora", ownerId: OWNER2, label: "Koramangala flat", address: "302, 5th Block, Koramangala", locality: "Koramangala", type: "Apartment", size: "3", rooms: { bed: 3, bath: 3, living: 1, kitchen: 1, balcony: 2, study: 0, terrace: 0, parking: 1 }, accessNote: "Watchman has the spare. Lift is on the left.", keyHolderName: "Security desk", keyHolderPhone: "+91 99860 33221", cover: "living" }),
  property({ id: "prp_white", ownerId: OWNER2, label: "Whitefield villa", address: "14, Prestige Ozone, Whitefield", locality: "Whitefield", type: "Villa", size: "4", rooms: { bed: 4, bath: 4, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 }, accessNote: "Clubhouse gate, not the main one. Say which villa at the boom barrier.", keyHolderName: "Estate office", keyHolderPhone: "+91 80456 77110", cover: "entrance" }),
  property({ id: "prp_jaya", ownerId: OWNER3, label: "Amma's house", address: "78, 9th Main, Jayanagar 4th Block", locality: "Jayanagar", type: "Independent house", size: "2", rooms: { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 1, parking: 1 }, accessNote: "Blue gate. The dog next door barks but does not come out.", keyHolderName: "Sudha (next door)", keyHolderPhone: "+91 98860 22110", cover: "entrance" }),
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
    video: i < done,
    items: b.items.map((t, j) => ({
      t,
      s: i < done ? ((i === 1 && j === 1 ? "attn" : "pass") as ItemState) : null,
      note: i === 1 && j === 1 ? "Someone has tipped building rubble over the north line. Roughly a truckload, and it was not here in the last photos." : "",
      photos: [],
    })),
  }));
}

/* Every visit needs a dozen fields that are the same on almost all of
   them. Spelling those out eleven times buries the two or three that
   actually differ. */
type VisitSeed = Partial<Visit> & Pick<Visit, "id" | "ref" | "propertyId"> & { property: Property };
const visit = ({ property, ...v }: VisitSeed): Visit => {
  const kind: VisitKind = v.kind ?? "inspection";
  const addOns = v.addOns ?? {};
  return {
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
    payoutInr: payoutFor(property, kind, addOns),
    otp: String(1000 + (property.id.charCodeAt(4) * 7 + (v.ref?.charCodeAt(9) ?? 3) * 13) % 9000),
    claimedAt: null,
    checkIn: null,
    draft: null,
    recording: false,
    createdAt: at(-3),
    startedAt: null,
    endedAt: null,
    reportId: null,
    ...v,
  } as Visit;
};

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
    users: [
      {
        id: OWNER,
        role: "owner",
        name: "Priya Sharma",
        phone: "9000000000",
        email: "priya@example.in",
        livesIn: "Dubai, UAE",
        createdAt: at(-240),
        onboardedAt: at(-240),
        /* Founding owner number one, who went straight onto a plan and
           never claimed the free inspection — so the launch offer is
           live in this account, and only the 2 BHK in Bengaluru
           qualifies for it. */
        foundingNo: 1,
        freeVisitUsedAt: null,
      },
      { id: OWNER2, role: "owner", name: "Vikram Rao", phone: "9000000011", email: "vikram@example.in", livesIn: "Singapore", createdAt: at(-150), onboardedAt: at(-150), foundingNo: 2, freeVisitUsedAt: at(-140) },
      { id: OWNER3, role: "owner", name: "Anita Nair", phone: "9000000012", email: "anita@example.in", livesIn: "London, UK", createdAt: at(-95), onboardedAt: at(-95), foundingNo: 3, freeVisitUsedAt: at(-90) },

      /* Verified inspectors. Their number is their sign-in, exactly like
         an owner's — the role on this row is what sends them to /field. */
      { id: "usr_ravi", role: "inspector", name: "Ravi K.", phone: "9000000001", email: "ravi@example.in", livesIn: "Marathahalli, Bengaluru", createdAt: at(-620), onboardedAt: at(-620), foundingNo: null, freeVisitUsedAt: null },
      { id: "usr_meena", role: "inspector", name: "Meena S.", phone: "9000000002", email: "meena@example.in", livesIn: "HSR Layout, Bengaluru", createdAt: at(-240), onboardedAt: at(-240), foundingNo: null, freeVisitUsedAt: null },
      { id: "usr_arun", role: "inspector", name: "Arun P.", phone: "9000000003", email: "arun@example.in", livesIn: "Yelahanka, Bengaluru", createdAt: at(-200), onboardedAt: at(-200), foundingNo: null, freeVisitUsedAt: null },
    ],

    properties: [indira, villa, plot, ...boardProps],

    subscriptions: [
      { id: "sub_indira", ownerId: OWNER, propertyId: "prp_indira", planId: "care", visitsTotal: 4, visitsUsed: 2, amountInr: 7999, startedAt: at(-240), renewsAt: dateOf(125), status: "active", coverUsedInr: 0 },
      { id: "sub_villa", ownerId: OWNER, propertyId: "prp_villa", planId: "care-plus", visitsTotal: 4, visitsUsed: 1, amountInr: 24999, startedAt: at(-120), renewsAt: dateOf(245), status: "active", coverUsedInr: 3300 },
    ],

    visits: [
      /* ── Priya's history ─────────────────────────────────────── */
      /* delivered last week — the report with a decision still waiting */
      visit({ id: "vis_indira_2", ref: "VIS-2026-0411", property: indira, propertyId: indira.id, kind: "inspection", planId: "care", addOns: { cleaning: 1 }, scheduledFor: dateOf(-6), slot: "13:00 – 16:00", status: "ready", inspectorId: "ins_ravi", paid: true, createdAt: at(-20), startedAt: at(-6, 13, 2), endedAt: at(-6, 14, 11), reportId: "rep_indira_2", claimedAt: at(-9) }),
      /* the villa's first visit — issue approved, repair closed */
      visit({ id: "vis_villa_1", ref: "VIS-2026-0388", property: villa, propertyId: villa.id, kind: "inspection", planId: "care-plus", scheduledFor: dateOf(-38), slot: "10:00 – 13:00", status: "closed", inspectorId: "ins_meena", paid: true, liveCall: true, createdAt: at(-50), startedAt: at(-38, 10, 5), endedAt: at(-38, 12, 1), reportId: "rep_villa_1", claimedAt: at(-42) }),
      /* happening right now — Arun is on site, mid-checklist */
      visit({ id: "vis_plot_1", ref: "VIS-2026-0414", property: plot, propertyId: plot.id, kind: "plot", planId: "plot-once", scheduledFor: dateOf(0), slot: "09:00 – 12:00", status: "on_site", inspectorId: "ins_arun", amountInr: 1999, paid: true, notes: "Please photograph the north-east stone first.", createdAt: at(-4), startedAt: at(0, 9, 14), claimedAt: at(-2), otp: "4417", checkIn: { at: at(0, 9, 14), lat: 13.2440, lng: 77.7121, distanceM: 38, doorPhoto: null }, draft: partialDraft(plot, 2) }),
      /* next week, Ravi has already claimed it */
      visit({ id: "vis_indira_3", ref: "VIS-2026-0419", property: indira, propertyId: indira.id, kind: "inspection", planId: "care", tierId: "refresh", addOns: { cleaning: 1 }, scheduledFor: dateOf(8), slot: "10:00 – 13:00", status: "assigned", inspectorId: "ins_ravi", amountInr: 999, liveCall: true, createdAt: at(-2), claimedAt: at(-1) }),

      /* ── the open board: nobody has claimed these yet ─────────── */
      visit({ id: "job_kora", ref: "VIS-2026-0421", property: boardProps[0], propertyId: "prp_kora", kind: "inspection", planId: "care", scheduledFor: dateOf(1), slot: "10:00 – 13:00", notes: "Third bathroom geyser was making a noise last time.", createdAt: at(-1) }),
      visit({ id: "job_jaya", ref: "VIS-2026-0422", property: boardProps[2], propertyId: "prp_jaya", kind: "inspection", planId: "one-time", addOns: { camera: 1 }, scheduledFor: dateOf(1), slot: "13:00 – 16:00", amountInr: 2499, notes: "Amma's house. Please be gentle with the wooden almirah doors — just photograph them shut.", createdAt: at(-1), liveCall: true }),
      visit({ id: "job_hsr", ref: "VIS-2026-0423", property: boardProps[3], propertyId: "prp_hsr", kind: "inspection", planId: "one-time", scheduledFor: dateOf(2), slot: "07:00 – 10:00", amountInr: 1999, notes: "Tenant just moved out — I need to know what they broke before I return the deposit.", createdAt: at(-1) }),
      visit({ id: "job_white", ref: "VIS-2026-0424", property: boardProps[1], propertyId: "prp_white", kind: "cleaning", planId: "one-time", tierId: "deep", scheduledFor: dateOf(2), slot: "10:00 – 13:00", amountInr: 7999, notes: "Crew is booked. You stay with them the whole time.", createdAt: at(-2) }),
      visit({ id: "job_yela", ref: "VIS-2026-0425", property: boardProps[4], propertyId: "prp_yela", kind: "plot", planId: "plot-once", scheduledFor: dateOf(3), slot: "07:00 – 10:00", amountInr: 1999, notes: "Somebody dumped construction debris on the north edge last month. Check if it has grown.", createdAt: at(-2) }),
      visit({ id: "job_malle", ref: "VIS-2026-0426", property: boardProps[5], propertyId: "prp_malle", kind: "inspection", planId: "one-time", addOns: { car: 1 }, scheduledFor: dateOf(4), slot: "16:00 – 19:00", amountInr: 2199, notes: "Car in the basement has not been started since March.", createdAt: at(-1) }),
      visit({ id: "job_kora2", ref: "VIS-2026-0427", property: boardProps[0], propertyId: "prp_kora", kind: "inspection", planId: "care", addOns: { cleaning: 1, camera: 1 }, scheduledFor: dateOf(6), slot: "13:00 – 16:00", createdAt: at(0) }),
    ],

    reports: [
      {
        id: "rep_indira_2", ref: "RPT-2026-0411", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        score: scoreOf(indiraCounts), counts: indiraCounts, rooms: indiraRooms,
        summary: "The house is in good order for a place that has been shut five months. One thing needs a decision — a slow leak under the first bathroom sink that is already swelling the cabinet base. The window latch and the balcony drain are small and can wait for the next visit if you would rather.",
        inspectorId: "ins_ravi", otpAt: "13:02", onSite: "13:02 → 14:11 (1h 09m)", gps: "12.9784° N, 77.6408° E", videos: "12 of 12 slots · all filled",
        publishedAt: at(-6, 14, 49), readAt: null, heldForReview: false,
      },
      {
        id: "rep_villa_1", ref: "RPT-2026-0388", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        score: scoreOf(villaCounts), counts: villaCounts, rooms: villaRooms,
        summary: "Terrace waterproofing is the real problem here — water is standing two days after rain and the parapet wall will start taking it. Everything else is maintenance: a chewed cable sleeve in the garage run and early grout darkening in the third bathroom.",
        inspectorId: "ins_meena", otpAt: "10:05", onSite: "10:05 → 12:01 (1h 56m)", gps: "12.9698° N, 77.7500° E", videos: "21 of 21 slots · all filled",
        publishedAt: at(-38, 12, 44), readAt: at(-37, 8, 12), heldForReview: false,
      },
    ],

    issues: [
      {
        id: "iss_leak", ref: "ISS-0917", reportId: "rep_indira_2", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        room: "Bathroom 1", title: "Water leakage under the sink", severity: "fail", variant: "bathroom",
        body: "Slow drip from the trap under the sink. Cabinet base is damp with early swelling. Recommend replacing the trap and sealing the joint before the board goes.",
        quote: { labour: 1800, parts: 1200, fee: 300, total: 3300, provider: "Suresh M.", trade: "Plumbing" },
        coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      {
        id: "iss_latch", ref: "ISS-0918", reportId: "rep_indira_2", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        room: "Bedroom 1", title: "Window latch does not seat", severity: "attn", variant: "bedroom",
        body: "Right-hand latch does not seat fully. The window closes but does not lock — worth fixing before the house is left shut again.",
        quote: { labour: 600, parts: 250, fee: 85, total: 935, provider: "Suresh M.", trade: "Carpentry" },
        coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
      },
      {
        id: "iss_terrace", ref: "ISS-0902", reportId: "rep_villa_1", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        room: "Terrace / garden", title: "Water standing at the north parapet", severity: "fail", variant: "balcony",
        body: "Water standing 4–5 cm two days after rain. The slope is wrong at the north end and the parapet joint is already darkening.",
        quote: { labour: 2400, parts: 900, fee: 330, total: 3630, provider: "Karan V.", trade: "Waterproofing" },
        coveredInr: 3300, decision: "approved", decidedAt: at(-37, 9, 2),
        repair: { status: "completed", providerName: "Karan V.", trade: "Waterproofing", scheduledFor: dateOf(-30), completedAt: at(-30, 15, 40), note: "Re-laid slope at the north 1.8 m, new drain mouth, joint sealed. Flooded and watched 30 min — clears in under 4." },
      },
      {
        id: "iss_wiring", ref: "ISS-0903", reportId: "rep_villa_1", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        room: "Electrical & mains", title: "Chewed cable sleeve, garage run", severity: "attn", variant: "electrical",
        body: "Sleeve chewed through on the garage run. Taped on site so it is safe, but the run should be replaced rather than patched.",
        quote: { labour: 900, parts: 600, fee: 150, total: 1650, provider: "Karan V.", trade: "Electrical" },
        coveredInr: 1650, decision: "declined", decidedAt: at(-37, 9, 5), repair: null,
      },
    ],

    invoices: [
      { id: "inv_1", ref: "INV-2026-0028", ownerId: OWNER, propertyId: "prp_villa", visitId: null, title: "Care+ · Garden Villa · one year", amountInr: 24999, status: "paid", method: "UPI · HDFC", createdAt: at(-120) },
      { id: "inv_2", ref: "INV-2026-0029", ownerId: OWNER, propertyId: "prp_villa", visitId: "vis_villa_1", title: "Terrace waterproofing · ISS-0902", amountInr: 330, status: "paid", method: "Covered by Care+ · ₹3,300 of ₹3,630", createdAt: at(-37) },
      { id: "inv_3", ref: "INV-2026-0030", ownerId: OWNER, propertyId: "prp_plot", visitId: "vis_plot_1", title: "Plot visit · Village Plot", amountInr: 1999, status: "paid", method: "UPI · HDFC", createdAt: at(-4) },
      { id: "inv_4", ref: "INV-2026-0031", ownerId: OWNER, propertyId: "prp_indira", visitId: "vis_indira_3", title: `Refresh clean · Ancestral Apartment · visit on ${new Date(Date.now() + 8 * DAY).getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(Date.now() + 8 * DAY).getMonth()]}`, amountInr: 999, status: "due", method: "", createdAt: at(-2) },
    ],

    events: [
      ev("report.ready", "Your report is ready", "Ancestral Apartment · health 84 · 1 issue needs your decision", -6, { propertyId: "prp_indira", visitId: "vis_indira_2", href: "/app/reports/rep_indira_2", readAt: null, action: true }),
      ev("visit.started", "Arun P. is on site", "Village Plot · boundary walk in progress", 0, { propertyId: "prp_plot", visitId: "vis_plot_1", href: "/app/visits/vis_plot_1", readAt: null }),
      ev("visit.assigned", "Ravi K. is assigned", `Ancestral Apartment · ${dateOf(8)} · 10:00 – 13:00`, -2, { propertyId: "prp_indira", visitId: "vis_indira_3", href: "/app/visits/vis_indira_3" }),
      ev("repair.completed", "Repair completed", "Garden Villa · terrace waterproofing · after-photos attached", -30, { propertyId: "prp_villa", href: "/app/reports/rep_villa_1" }),
      ev("issue.approved", "You approved a repair", "Garden Villa · ISS-0902 · ₹3,630 · ₹3,300 covered by Care+", -37, { propertyId: "prp_villa", href: "/app/reports/rep_villa_1" }),
      ev("report.ready", "Your report is ready", "Garden Villa · health " + scoreOf(villaCounts) + " · 2 issues flagged", -38, { propertyId: "prp_villa", visitId: "vis_villa_1", href: "/app/reports/rep_villa_1" }),
      ev("plan.started", "Care+ started", "Garden Villa · 4 inspections a year · repairs covered to ₹20,000", -120, { propertyId: "prp_villa", href: "/app/plan" }),
      ev("property.added", "Ancestral Apartment added", "C-14, 100 Ft Road, Indiranagar", -240, { propertyId: "prp_indira", href: "/app/properties/prp_indira" }),
    ],

    inspectors: [
      {
        id: "ins_ravi", userId: "usr_ravi", name: "Ravi K.", initials: "RK", phone: "9000000001",
        area: "Whitefield · Marathahalli · Indiranagar", city: "Bengaluru", baseLocality: "Marathahalli",
        areas: ["Marathahalli", "Whitefield", "Indiranagar", "Bellandur", "Koramangala", "HSR Layout"],
        rating: 4.9, visits: 212, since: "2024", bg: "Ex-facility supervisor, 11 yrs",
        verified: true, status: "active", depositInr: 5000, reviewedReports: 5,
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
        verified: true, status: "probation", depositInr: 5000, reviewedReports: 3,
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
        verified: true, status: "active", depositInr: 5000, reviewedReports: 5,
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

    sessions: [],
    otps: [],
  };
}
