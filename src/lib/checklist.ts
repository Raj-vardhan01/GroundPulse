/* ════════════════════════════════════════════════════════════════
   The 42-item checklist the site promises, generated from the rooms
   an owner actually registered. A 2 BHK gets two bedroom blocks, a
   4 BHK gets four — the number on the marketing page is the typical
   case, not a fixed list.
   ════════════════════════════════════════════════════════════════ */

import type { Property, ReportRoom, RoomKey } from "@/lib/types";

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
  parking: { one: "Parking", variant: "entrance", items: ["Started & idled 10 min", "Battery, tyres, leaks", "Cover on, odometer photo"] },
};

const order: RoomKey[] = ["living", "kitchen", "bed", "bath", "balcony", "study", "terrace", "parking"];

/** Every room block a visit to this property will produce, in walk order. */
export function blocksFor(p: Property): Block[] {
  if (p.kind === "plot") return PLOT_BLOCKS;
  const out: Block[] = [ENTRY];
  for (const k of order) {
    const n = p.rooms?.[k] ?? 0;
    const t = perRoom[k];
    for (let i = 0; i < n; i++) out.push({ name: n > 1 ? `${t.one} ${i + 1}` : t.one, variant: t.variant, items: t.items });
  }
  out.push(ELECTRICAL, EXIT);
  return out;
}

const PLOT_BLOCKS: Block[] = [
  { name: "Boundary walk", variant: "balcony", items: ["All four corners photographed", "Fence & gate condition", "Boundary stones in place"] },
  { name: "Encroachment", variant: "balcony", items: ["Unauthorised construction", "Occupation or dumping", "Neighbour activity at the line"] },
  { name: "Access & notices", variant: "entrance", items: ["Approach road", "Signboard present", "Notices or markings"] },
  { name: "Utilities & works", variant: "electrical", items: ["Road or utility work touching the plot", "Water logging & drainage"] },
];

export const itemCount = (p: Property) => blocksFor(p).reduce((n, b) => n + b.items.length, 0);

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
