/* ════════════════════════════════════════════════════════════════
   The 42-item checklist the site promises, generated from the rooms
   an owner actually registered. A 2 BHK gets two bedroom blocks, a
   4 BHK gets four — the number on the marketing page is the typical
   case, not a fixed list.
   ════════════════════════════════════════════════════════════════ */

import type { DraftRoom, Property, ReportRoom, RoomKey, Visit } from "@/lib/types";

type Block = { name: string; variant: ReportRoom["variant"]; items: string[] };

const ENTRY: Block = {
  name: "Entrance & hallway",
  variant: "entrance",
  items: ["Main door & lock", "Letterbox / notices", "Signs of forced entry", "Meter reading photo"],
};
/* Always walked, whatever the layout — it is where most of what a shut
   house does to itself shows up first. */
const ELECTRICAL: Block = {
  name: "Electrical & mains",
  variant: "electrical",
  items: ["MCB / distribution board", "Sockets tested", "Meter reading photo", "Visible wiring & rodent damage"],
};
const EXIT: Block = {
  name: "Exit walkthrough",
  variant: "living",
  items: ["Gas shut off", "Main door locked", "Wardrobes closed", "Lights & mains off"],
};

const perRoom: Record<RoomKey, { one: string; variant: ReportRoom["variant"]; items: string[] }> = {
  living: { one: "Living / dining", variant: "living", items: ["Walls, ceiling, damp", "Windows & latches", "Sockets & switches", "Fans & lights"] },
  kitchen: { one: "Kitchen", variant: "kitchen", items: ["Sink & plumbing", "Gas connection (off)", "Chimney & cabinets", "Pest & mould signs"] },
  bed: { one: "Bedroom", variant: "bedroom", items: ["Window locks", "Ceiling & walls", "AC unit", "Wardrobe (closed)"] },
  bath: { one: "Bathroom", variant: "bathroom", items: ["Sink & plumbing", "Taps & geyser", "Drainage", "Seepage & tiles"] },
  balcony: { one: "Balcony", variant: "balcony", items: ["Railing", "Drainage", "Plants / pests"] },
  study: { one: "Study / store", variant: "living", items: ["Damp & ventilation", "Stored items intact", "Sockets & switches"] },
  terrace: { one: "Terrace / garden", variant: "balcony", items: ["Waterproofing & pooling", "Boundary & gate", "Growth & debris"] },
  /* The space itself. Starting and checking a car is the ₹700 car
     inspection, and only happens when it was booked — see CAR below. */
  parking: { one: "Parking", variant: "entrance", items: ["Space, gate & access", "Seepage, debris or damage", "Vehicle present, cover on"] },
};

/* One block per car booked on the visit. */
const CAR: Omit<Block, "name"> = {
  variant: "entrance",
  items: ["Started & idled 10 min", "Battery, tyres, leaks", "Odometer photo"],
};

const order: RoomKey[] = ["living", "kitchen", "bed", "bath", "balcony", "study", "terrace", "parking"];

const carBlocks = (v?: Pick<Visit, "addOns"> | null): Block[] => {
  const n = Math.max(0, Math.min(6, v?.addOns?.car ?? 0));
  return Array.from({ length: n }, (_, i) => ({ name: n > 1 ? `Car ${i + 1}` : "Car", ...CAR }));
};

/** Every block a visit to this property will produce, in walk order.
    Pass the visit and the cars booked on it are walked too. */
export function blocksFor(p: Property, v?: Pick<Visit, "addOns"> | null): Block[] {
  if (p.kind === "plot") return [...PLOT_BLOCKS, ...carBlocks(v)];
  const out: Block[] = [ENTRY];
  for (const k of order) {
    const n = p.rooms?.[k] ?? 0;
    const t = perRoom[k];
    for (let i = 0; i < n; i++) out.push({ name: n > 1 ? `${t.one} ${i + 1}` : t.one, variant: t.variant, items: t.items });
  }
  out.push(...carBlocks(v), ELECTRICAL, EXIT);
  return out;
}

const PLOT_BLOCKS: Block[] = [
  { name: "Boundary walk", variant: "balcony", items: ["All four corners photographed", "Fence & gate condition", "Boundary stones in place"] },
  { name: "Encroachment", variant: "balcony", items: ["Unauthorised construction", "Occupation or dumping", "Neighbour activity at the line"] },
  { name: "Access & notices", variant: "entrance", items: ["Approach road", "Signboard present", "Notices or markings"] },
  { name: "Utilities & works", variant: "electrical", items: ["Road or utility work touching the plot", "Water logging & drainage"] },
];

export const itemCount = (p: Property, v?: Pick<Visit, "addOns"> | null) => blocksFor(p, v).reduce((n, b) => n + b.items.length, 0);

/* ── health score ────────────────────────────────────────────────
   Plain arithmetic, printed on the report so nobody has to trust a
   number they can't reproduce: start at 100, an attention costs 3,
   a fail costs 10. */
export const HEALTH = { attn: 3, fail: 10 };
export const scoreOf = (counts: { attn: number; fail: number }) =>
  Math.max(0, Math.min(100, 100 - counts.attn * HEALTH.attn - counts.fail * HEALTH.fail));

export const countItems = (rooms: ReportRoom[]) => {
  const c = { pass: 0, attn: 0, fail: 0 };
  for (const r of rooms) for (const i of r.items) c[i.s]++;
  return c;
};

/** What is still missing on a checklist, in the order an inspector
    would fix it. The submit button reads this, and so does the server —
    a validation that only runs in the browser is a suggestion. */
export function outstanding(draft: DraftRoom[]) {
  const out: string[] = [];
  for (const r of draft) {
    const unanswered = r.items.filter((i) => i.s === null).length;
    if (unanswered) out.push(`${r.name} — ${unanswered} item${unanswered > 1 ? "s" : ""} unanswered`);
    for (const i of r.items) {
      if (i.s && i.s !== "pass" && !i.photos.length && !(i.videos ?? []).length) out.push(`${r.name} · ${i.t} — flagged with no photo or video`);
      if (i.s && i.s !== "pass" && !i.note.trim()) out.push(`${r.name} · ${i.t} — flagged with no note`);
    }
    if (!r.video) out.push(`${r.name} — room video missing`);
  }
  return out;
}
