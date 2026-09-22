export type Plan = {
  id: string;
  name: string;
  price: number;
  period: string;
  tagline: string;
  /** 3 BHK price */
  price3?: number;
  /** 4 BHK+ price */
  price4?: number;
  popular?: boolean;
  worth?: string;
  includes: string[];
  cta: string;
  /** inspections included per plan period — extra rooms are charged per inspection */
  visits?: number;
};

export const plans: Plan[] = [
  {
    id: "one-time",
    visits: 1,
    name: "One-time visit",
    price: 1999,
    price3: 2499,
    price4: 2999,
    period: "one inspection",
    tagline: "Just need eyes on it once? Book a single verified visit.",
    includes: [
      "1 verified inspector visit — stays as long as it takes",
      "Room-by-room checklist, photos & video on every item",
      "Report within the hour, with photos and video",
      "Approve or decline any flagged repair",
      "Add cleaning to the same visit — refresh +₹999, deep clean from +₹3,999 — or a car check (₹700)",
    ],
    cta: "Book a visit",
  },
  {
    id: "care",
    visits: 4,
    name: "Care",
    price: 7999,
    price3: 9999,
    price4: 11999,
    period: "per year",
    tagline: "A verified inspector every quarter, and a clean home twice a year.",
    popular: true,
    worth: "₹9,994 value",
    includes: [
      "4 inspections a year (one every quarter)",
      "2 refresh cleans a year — your whole home, at its size, inspector on site",
      "Reports within the hour, compared with your last visit",
      "Owner-approved repairs by verified pros",
      "Cleaning on any visit: refresh +₹999 · deep clean from +₹3,999 · car ₹700",
    ],
    cta: "Start Care",
  },
  {
    id: "care-plus",
    visits: 4,
    name: "Care+",
    price: 14999,
    price3: 19999,
    price4: 24999,
    period: "per year",
    tagline: "Inspections, cleaning and the repairs handled — up to ₹20,000 covered.",
    includes: [
      "Everything in Care — 4 inspections + 2 refresh cleans",
      "2 maintenance services (plumbing, electrical, anything) — done during a visit, inspector supervising",
      "Repairs covered up to ₹20,000 a year (₹10,000 max per repair). We pay up to ₹7,000 of parts per repair; the rest of the cover goes to labour and miscellaneous expenses.",
      "Priority assignment of verified pros",
      "Cleaning on any visit: refresh +₹999 · deep clean from +₹3,999 · car ₹700",
    ],
    cta: "Start Care+",
  },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ── Add-ons (any plan, any visit) ─────────────────────────────── */
export const addOns = [
  { id: "camera", name: "Full-visit video recording", price: 500, unit: "per visit", note: "Your inspector wears a body camera from the moment they walk in until they leave · you get the whole video on a private link" },
  { id: "cleaning", name: "Refresh clean", price: 999, unit: "on any visit", note: "Cobwebs, fans, floors, surfaces, taps run · added to a visit you are already booking · any size" },
  { id: "deep", name: "Deep clean", price: 3999, unit: "from · 1 BHK, on any visit", note: "Scrubbed, descaled, degreased · before/after photos · 2 BHK ₹4,499 · 3 BHK ₹5,499 · 4 BHK ₹6,499" },
  { id: "car", name: "Car inspection", price: 700, unit: "per car", note: "Start & idle, battery, tyres, leaks, odometer photo, cover check" },
  { id: "plot", name: "Plot / land visit", price: 1999, unit: "per visit", note: "Boundary walk, GPS-tagged photos, encroachment & occupation check" },
];

/* ── Cleaning ─────────────────────────────────────────────────────
   Two tiers, five sizes, itemised extras and the full method now live
   in `lib/cleaning.ts` and on /cleaning. Prices here are the headline
   numbers only — change them there, not in this file. */
export const cleaningFrom = { refresh: 1999, deep: 4999, riderRefresh: 999, riderDeep: 3999 };

/* ── The pre-arrival package — our sharpest use case ──────────────
   Urban Company and every other cleaning app need someone at home to
   let the crew in. An owner flying in on Friday is exactly the person
   who can't. That gap is the product. */
export const comingHome = {
  name: "Coming home",
  from: 4999,
  lead: "Book 2–3 days before you land",
  steps: [
    { t: "Day 0 — you book", b: "Tell us your arrival date. No keys to courier, no neighbour to co-ordinate, nothing for you to organise from another country." },
    { t: "Day 1 — inspector walks it", b: "A verified inspector goes in once you confirm, runs the full checklist and films every room. You get the report within the hour — including anything broken, with a quote." },
    { t: "Day 1 — crew cleans, supervised", b: "The cleaning crew works with your inspector on site the entire time. Before and after photographs of every room land in the same report — and the crew brings its own ladder, buckets and machines, because nobody is home to hand them anything." },
    { t: "Day 2 — repairs, if you approved any", b: "Anything you said yes to gets fixed before you arrive, by a verified pro, inspector present, after-photos attached." },
    { t: "The day you land", b: "You open the door to a clean, working house — and you already know everything about it, because you read the report on the plane." },
  ],
};

/* ── What we inspect ──────────────────────────────────────────── */
export const assets = [
  { id: "home", name: "Homes", b: "Apartments, villas, parents' house — room by room, every item with proof.", from: "from ₹1,999" },
  { id: "plot", name: "Plots & land", b: "Is anyone sitting on it? Boundary walk, GPS photos, unauthorised construction, notices.", from: "from ₹1,999" },
  { id: "car", name: "Cars", b: "The car parked in the basement for 9 months — started, checked, photographed.", from: "₹700 per car" },
];

/* ── Plots & land — same priority as homes ───────────────────── */
export const plotPlans: Plan[] = [
  {
    id: "plot-once",
    visits: 1,
    name: "Plot visit",
    price: 1999,
    period: "one visit",
    tagline: "Haven't seen your land in months? Get eyes on it this week.",
    includes: [
      "Full boundary walk with a GPS-tagged photo of every corner",
      "Encroachment, occupation & unauthorised construction check",
      "Fence, gate, signboard and neighbour activity",
      "Notices, dumping, road or utility work touching the plot",
      "Report within the hour, with a photo map",
      "Book again any time — no subscription needed",
    ],
    cta: "Book a plot visit",
  },
];

/* ── What a ₹1,999 visit covers ──────────────────────────────── */
export const visitCovers = [
  "Room-by-room 42-item checklist with photos & video",
  "Leaks, seepage, damp and drainage",
  "Electrical: MCB, sockets, meter reading photo",
  "Locks, doors, windows and security signs",
  "Water supply, tank, geyser and gas shut-off",
  "Pest, mould and long-idle damage signs",
  "Society notices, dues slips and mail collected",
  "Caretaker / tenant identity check on request",
];
export const visitUseCases = ["Before you fly down", "After a storm or monsoon", "Tenant check-in / check-out", "Parents' house, once a quarter", "Before you buy or rent it out"];

/* ── Care+ cover terms (plain language) ──────────────────────── */
export const carePlusCover = {
  yearly: 20000,
  perIncident: 10000,
  partsPerIncident: 7000,
  terms: [
    { t: "Up to ₹20,000 a year", b: "The total value of repairs we cover across your plan year." },
    { t: "Up to ₹10,000 per incident", b: "One repair can use at most half the yearly cover. The rest stays for later." },
    { t: "Labour fully included", b: "The verified provider's work — plumbing, electrical, carpentry, masonry — is on us, every time." },
    { t: "Parts: we pay up to ₹7,000 per incident", b: "Taps, traps, switches, wiring, small motors, fittings — we pay up to ₹7,000 of parts on every incident. The rest of the per-incident cover goes to labour and miscellaneous expenses. Anything beyond the cover is quoted and only happens after you approve it." },
    { t: "Only through verified providers", b: "Cover applies to repairs assigned by us, done during a visit with your inspector present. Outside bills aren't covered." },
  ],
  excluded: [
    "Appliance replacement — AC, geyser, fridge, washing machine, RO",
    "Structural & civil work — walls, roof, waterproofing, plumbing lines inside walls",
    "Anything already broken on day one — cover starts with your first inspection; whatever is flagged in that first report is quoted separately, no pressure",
    "Damage from misuse, pests, floods or other force majeure",
    "Painting, furniture and cosmetic upgrades",
  ],
  examples: [
    { s: "Leak under the bathroom sink — new trap + sealing", cost: "₹1,800", r: "Fully covered", ok: true },
    { s: "Bedroom MCB tripping — 2 switches + rewiring a point", cost: "₹3,200", r: "Fully covered", ok: true },
    { s: "Kitchen motor + pipe — parts ₹9,000 + labour ₹1,500", cost: "₹10,500", r: "We pay ₹8,500 (₹7,000 parts + labour) · you pay ₹2,000", ok: true },
    { s: "Geyser burst — new geyser ₹11,000 + fitting ₹1,200", cost: "₹12,200", r: "Fitting covered · geyser excluded (appliance)", ok: false },
    { s: "Terrace waterproofing", cost: "₹40,000", r: "Excluded (structural) — we quote it, you decide", ok: false },
  ],
};
