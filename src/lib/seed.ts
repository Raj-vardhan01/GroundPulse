/* ════════════════════════════════════════════════════════════════
   The demo account.

   A brand-new sign-in starts empty and is walked through adding a
   property — but an empty app shows none of what this product
   actually is. So the store ships with one owner who has been on the
   service a while: a delivered report with a decision waiting, a
   visit happening right now, a repair already closed out.

   Sign in as +91 90000 00000 to land in it.
   ════════════════════════════════════════════════════════════════ */

import type { DB, Property, ReportRoom, Event, EventType } from "@/lib/types";
import { blocksFor, countItems, scoreOf } from "@/lib/checklist";

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
      },
    ],

    properties: [indira, villa, plot],

    subscriptions: [
      { id: "sub_indira", ownerId: OWNER, propertyId: "prp_indira", planId: "care", visitsTotal: 4, visitsUsed: 2, amountInr: 7999, startedAt: at(-240), renewsAt: dateOf(125), status: "active", coverUsedInr: 0 },
      { id: "sub_villa", ownerId: OWNER, propertyId: "prp_villa", planId: "care-plus", visitsTotal: 4, visitsUsed: 1, amountInr: 24999, startedAt: at(-120), renewsAt: dateOf(245), status: "active", coverUsedInr: 3300 },
    ],

    visits: [
      /* delivered last week — the report with a decision still waiting */
      { id: "vis_indira_2", ref: "VIS-2026-0411", ownerId: OWNER, propertyId: "prp_indira", kind: "inspection", planId: "care", tierId: "", addOns: { cleaning: 1 }, scheduledFor: dateOf(-6), slot: "13:00 – 16:00", status: "ready", inspectorId: "ins_ravi", amountInr: 0, paid: true, liveCall: false, notes: "", createdAt: at(-20), startedAt: at(-6, 13, 2), endedAt: at(-6, 14, 11), reportId: "rep_indira_2" },
      /* the villa's first visit — issue approved, repair closed */
      { id: "vis_villa_1", ref: "VIS-2026-0388", ownerId: OWNER, propertyId: "prp_villa", kind: "inspection", planId: "care-plus", tierId: "", addOns: {}, scheduledFor: dateOf(-38), slot: "10:00 – 13:00", status: "closed", inspectorId: "ins_meena", amountInr: 0, paid: true, liveCall: true, notes: "", createdAt: at(-50), startedAt: at(-38, 10, 5), endedAt: at(-38, 12, 1), reportId: "rep_villa_1" },
      /* happening right now */
      { id: "vis_plot_1", ref: "VIS-2026-0414", ownerId: OWNER, propertyId: "prp_plot", kind: "plot", planId: "plot-once", tierId: "", addOns: {}, scheduledFor: dateOf(0), slot: "09:00 – 12:00", status: "on_site", inspectorId: "ins_arun", amountInr: 1999, paid: true, liveCall: false, notes: "Please photograph the north-east stone first.", createdAt: at(-4), startedAt: at(0, 9, 14), endedAt: null, reportId: null },
      /* next week, inspector already assigned */
      { id: "vis_indira_3", ref: "VIS-2026-0419", ownerId: OWNER, propertyId: "prp_indira", kind: "inspection", planId: "care", tierId: "refresh", addOns: { cleaning: 1 }, scheduledFor: dateOf(8), slot: "10:00 – 13:00", status: "assigned", inspectorId: "ins_ravi", amountInr: 999, paid: false, liveCall: true, notes: "", createdAt: at(-2), startedAt: null, endedAt: null, reportId: null },
    ],

    reports: [
      {
        id: "rep_indira_2", ref: "RPT-2026-0411", visitId: "vis_indira_2", propertyId: "prp_indira", ownerId: OWNER,
        score: scoreOf(indiraCounts), counts: indiraCounts, rooms: indiraRooms,
        summary: "The house is in good order for a place that has been shut five months. One thing needs a decision — a slow leak under the first bathroom sink that is already swelling the cabinet base. The window latch and the balcony drain are small and can wait for the next visit if you would rather.",
        inspectorId: "ins_ravi", otpAt: "13:02", onSite: "13:02 → 14:11 (1h 09m)", gps: "12.9784° N, 77.6408° E", videos: "12 of 12 slots · all filled",
        publishedAt: at(-6, 14, 49), readAt: null,
      },
      {
        id: "rep_villa_1", ref: "RPT-2026-0388", visitId: "vis_villa_1", propertyId: "prp_villa", ownerId: OWNER,
        score: scoreOf(villaCounts), counts: villaCounts, rooms: villaRooms,
        summary: "Terrace waterproofing is the real problem here — water is standing two days after rain and the parapet wall will start taking it. Everything else is maintenance: a chewed cable sleeve in the garage run and early grout darkening in the third bathroom.",
        inspectorId: "ins_meena", otpAt: "10:05", onSite: "10:05 → 12:01 (1h 56m)", gps: "12.9698° N, 77.7500° E", videos: "21 of 21 slots · all filled",
        publishedAt: at(-38, 12, 44), readAt: at(-37, 8, 12),
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
      ev("plan.started", "Care+ started", "Garden Villa · 4 inspections a year · repairs covered to ₹25,000", -120, { propertyId: "prp_villa", href: "/app/plan" }),
      ev("property.added", "Ancestral Apartment added", "C-14, 100 Ft Road, Indiranagar", -240, { propertyId: "prp_indira", href: "/app/properties/prp_indira" }),
    ],

    inspectors: [
      { id: "ins_ravi", name: "Ravi K.", initials: "RK", area: "Whitefield · Marathahalli · Indiranagar", rating: 4.9, visits: 212, since: "2024", bg: "Ex-facility supervisor, 11 yrs", verified: true },
      { id: "ins_meena", name: "Meena S.", initials: "MS", area: "Koramangala · HSR", rating: 5.0, visits: 148, since: "2025", bg: "Ex-bank operations, 8 yrs", verified: true },
      { id: "ins_arun", name: "Arun P.", initials: "AP", area: "Yelahanka · Devanahalli", rating: 4.8, visits: 96, since: "2025", bg: "Ex-Army JCO, plots & land", verified: true },
    ],

    sessions: [],
    otps: [],
  };
}
