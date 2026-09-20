/* ════════════════════════════════════════════════════════════════
   CLEANING — the whole offer in one place.

   Two tiers, priced by the size of the home, both all-in: the
   verified inspector, the crew, the report and the before/after
   photographs are one number. Nothing here is a "starting from"
   that grows at the door.

   Everything a cleaning app charges extra for and hides in an
   asterisk — chimney, fridge, cabinet interiors, sofa shampoo —
   is listed below at its own price, chosen before you pay.
   ════════════════════════════════════════════════════════════════ */

export type BhkKey = "1" | "2" | "3" | "4" | "5";
export type TierId = "refresh" | "deep";

export const bhkKeys: BhkKey[] = ["1", "2", "3", "4", "5"];
export const bhkLabel: Record<BhkKey, string> = { "1": "1 BHK", "2": "2 BHK", "3": "3 BHK", "4": "4 BHK", "5": "5 BHK" };

/* What each size covers as standard — the same table every cleaning
   app buries three taps deep, in addition to living room & kitchen. */
export const coverage: Record<BhkKey, { bed: number; bath: number; balcony: number }> = {
  "1": { bed: 1, bath: 1, balcony: 1 },
  "2": { bed: 2, bath: 2, balcony: 2 },
  "3": { bed: 3, bath: 3, balcony: 3 },
  "4": { bed: 4, bath: 4, balcony: 4 },
  "5": { bed: 5, bath: 5, balcony: 5 },
};

/* The inspection on its own, by size — used to show what the clean
   actually adds when you are already booking a visit. */
export const visitPrice: Record<BhkKey, number> = { "1": 1499, "2": 1999, "3": 2499, "4": 2999, "5": 3499 };

export type Tier = {
  id: TierId;
  name: string;
  /** one line on the shelf */
  tagline: string;
  /** the sentence that tells you whether this is your tier */
  pick: string;
  price: Record<BhkKey, number>;
  /** the clean charged on top of an inspection you are already booking */
  rider: Record<BhkKey, number>;
  hours: Record<BhkKey, string>;
  crew: Record<BhkKey, string>;
  /** the six lines that define the tier */
  does: string[];
  /** said plainly, so nobody buys the wrong one */
  doesnt: string;
};

export const tiers: Tier[] = [
  {
    id: "refresh",
    name: "Refresh clean",
    tagline: "Dust, not grease.",
    pick: "Pick this if the house has just been shut a while and nobody has cooked in it. It is a genuinely lighter job than a deep clean, so it is priced like one.",
    price: { "1": 1999, "2": 2499, "3": 2999, "4": 3999, "5": 4999 },
    rider: { "1": 999, "2": 999, "3": 999, "4": 999, "5": 999 },
    hours: { "1": "2 hrs", "2": "2–3 hrs", "3": "3 hrs", "4": "3–4 hrs", "5": "4–5 hrs" },
    crew: { "1": "1 cleaner", "2": "1 cleaner", "3": "1–2 cleaners", "4": "2 cleaners", "5": "2 cleaners" },
    does: [
      "Cobwebs, ceiling corners and every fan dusted down",
      "All floors swept and mopped with disinfectant",
      "Surfaces, sills, switchboards and wardrobe fronts wiped",
      "Kitchen slab, sink and hob wiped clean",
      "Bathroom surfaces wiped and the WC cleaned",
      "Every tap and trap run so the seals don't dry out",
      "Windows opened, the house aired, waste cleared out",
    ],
    doesnt: "It will not cut months of cooking grease off a chimney, or bring yellowed grout back. That is the deep clean, and we will say so in the report rather than take your money twice.",
  },
  {
    id: "deep",
    name: "Deep clean",
    tagline: "Scrubbed, descaled, degreased.",
    pick: "Pick this if you are actually walking back in, moving in or handing over — or if the last proper clean was more than a year ago.",
    price: { "1": 4999, "2": 5499, "3": 6499, "4": 7999, "5": 9499 },
    rider: { "1": 3999, "2": 4499, "3": 5499, "4": 6499, "5": 7499 },
    hours: { "1": "4–5 hrs", "2": "5–6 hrs", "3": "6–7 hrs", "4": "7–8 hrs", "5": "8–9 hrs" },
    crew: { "1": "2 cleaners", "2": "2 cleaners", "3": "2–3 cleaners", "4": "3 cleaners", "5": "3–4 cleaners" },
    does: [
      "Every floor machine-scrubbed, then mopped with disinfectant",
      "Kitchen degreased — hob, burner pores, slab, backsplash and sink descaled",
      "Bathroom tiles and grout machine-scrubbed, WC and taps descaled",
      "Ceilings, fans, reachable walls, skirting and switchboards",
      "Window glass both sides where it is safe, tracks, grills and mesh",
      "Doors, handles, light fittings, cupboard tops and furniture exteriors",
      "Balconies scrubbed, railings and drains cleared",
    ],
    doesnt: "Appliances and soft furnishing are not silently folded in. Chimney, fridge, microwave, cabinet interiors and sofa shampoo are each priced below — you add the ones you want, and pay for nothing you don't.",
  },
];

export const tierById = (id: TierId) => tiers.find((t) => t.id === id)!;

/* ── Extras ───────────────────────────────────────────────────────
   Chosen upfront in the builder, never sprung on you at the door.
   `price: 0` means it is genuinely part of the clean. */

export type Extra = {
  id: string;
  name: string;
  price: number;
  note: string;
  /** a countable thing — "per mattress", "each" */
  per?: string;
  max?: number;
};
export type ExtraGroup = { id: string; name: string; lede: string; items: Extra[] };

export const extraGroups: ExtraGroup[] = [
  {
    id: "kitchen",
    name: "Kitchen & appliances",
    lede: "The stove, slab, sink and cabinet fronts are always part of the clean. These four are where the real grease lives — take the ones you need.",
    items: [
      { id: "cab-ext", name: "Cabinet exteriors & shutters", price: 0, note: "Fronts, handles, shutter tops and the edges you can't see. Always included — never charged for." },
      { id: "cab-int", name: "Cabinet interiors + utensil arrangement", price: 599, note: "Every shelf emptied and wiped inside, lined, and your utensils stacked back in order." },
      { id: "chimney", name: "Chimney — exterior & filter", price: 499, note: "Exterior degreased; the filter comes out, soaks and is scrubbed until oil stops beading on it." },
      { id: "fridge", name: "Fridge — inside & out", price: 549, note: "Exterior for grease and stains, interior shelves and trays for spills, and the smell that comes with them." },
      { id: "microwave", name: "Microwave — inside & out", price: 249, note: "Exterior grease off; inside, food residue, burnt spots and odour lifted." },
    ],
  },
  {
    id: "soft",
    name: "Sofa & mattress",
    lede: "Dry vacuuming is part of every clean. Shampooing is the wet job that actually lifts stains — add it per sofa and per bed.",
    items: [
      { id: "dryvac", name: "Dry vacuuming — sofas & mattresses", price: 0, note: "Crumbs, dust and grit out of every surface, corner and crevice. Included on both tiers." },
      { id: "mattress", name: "Mattress shampoo", price: 449, per: "per mattress", max: 6, note: "Foam-shampooed, wet-vacuumed and dried. Add one for each bed you want done." },
      { id: "sofa34", name: "Sofa wet shampoo · 3–4 seater", price: 549, per: "each", max: 4, note: "Foam shampoo worked in, stains lifted, wet-vacuumed back out. Fabric sofas only." },
      { id: "sofa56", name: "Sofa wet shampoo · 5–6 seater", price: 699, per: "each", max: 3, note: "Same four-step process across a larger frame, cushions done separately." },
      { id: "sofa7", name: "Sofa wet shampoo · 7+ seater or L-shape", price: 899, per: "each", max: 2, note: "Sectionals and L-shapes — every module lifted, shampooed and vacuumed out." },
    ],
  },
  {
    id: "space",
    name: "Extra spaces",
    lede: "Your size already covers the bedrooms, bathrooms and balconies in the table above. Anything past that is priced here, not argued about later.",
    items: [
      { id: "balcony", name: "Extra balcony", price: 449, per: "each", max: 6, note: "Railings, grills, floor scrubbed, drain cleared and the parapet wiped down." },
      { id: "utility", name: "Store / utility room", price: 449, per: "each", max: 3, note: "Washing area descaled, shelves and racks wiped, floor scrubbed, drain cleared." },
      { id: "bathroom", name: "Extra bathroom", price: 499, per: "each", max: 5, note: "Tiles and grout scrubbed, WC descaled, taps and shower head, mirror, exhaust, drain." },
    ],
  },
];

export const allExtras: Extra[] = extraGroups.flatMap((g) => g.items);
export const extraById = (id: string) => allExtras.find((e) => e.id === id);

/* ── How we clean — the method, area by area ─────────────────────
   Written so you can check the crew against it from 6,000 km away. */

/* Every surface we can show a before and an after for. The artwork is
   ours — illustrations of the real job, drawn in the same frame clean
   and dirty. The day we have job photographs from a real visit they
   drop into the same component and nothing else changes. */
export type ShotName =
  | "chimney" | "stove" | "slab" | "fridge"
  | "grout" | "wc" | "shower"
  | "floor" | "fan" | "window"
  | "sofa" | "mattress" | "balcony";

export type MethodArea = {
  id: string;
  area: string;
  shots: [ShotName, ShotName];
  lede: string;
  steps: { t: string; b: string; extra?: string; chip?: string }[];
};

export const method: MethodArea[] = [
  {
    id: "kitchen",
    area: "Kitchen",
    shots: ["chimney", "stove"],
    lede: "The room that decides whether a clean was real. Everything here is oil, and oil only comes off with a degreaser and time.",
    steps: [
      { t: "Stove & hob", b: "Stovetop, knobs and burner pores scrubbed out so the flame burns blue and even again instead of orange and patchy." },
      { t: "Chimney", b: "Exterior degreased, then the filter comes out, soaks in hot solution and is scrubbed until oil stops beading on the mesh.", extra: "chimney" },
      { t: "Fridge", b: "Exterior for grease and hand marks; inside, shelves and trays pulled out, food spills cleared and the odour taken out with it.", extra: "fridge" },
      { t: "Microwave", b: "Exterior grease off the door and panel; inside, food residue and burnt-on spots steamed and lifted, then deodorised.", extra: "microwave" },
      { t: "Cabinets", b: "Fronts, handles and shutter tops always. Add interiors and every shelf is emptied, wiped, lined and your utensils stacked back in order.", extra: "cab-int" },
      { t: "Sink, slab & backsplash", b: "Sink descaled back to the metal, granite slabs cut through, backsplash tile and the grout between it scrubbed by hand." },
      { t: "Floor", b: "Machine-scrubbed with degreaser, corners and the gap behind the fridge done by hand, mopped with disinfectant at the end." },
    ],
  },
  {
    id: "bathroom",
    area: "Bathrooms",
    shots: ["grout", "wc"],
    lede: "Hard water is the enemy here, not dirt. Descaling is chemistry and dwell time — which is why a rushed crew can never fake it.",
    steps: [
      { t: "Tiles & grout", b: "Scrubbing machine across the floor, grout brush along every single line — yellowing, soap film and hard-water marks lifted." },
      { t: "WC", b: "Descaled inside the bowl and up under the rim, then the seat, hinges, cistern and the pipework behind it that nobody ever does." },
      { t: "Taps & shower", b: "Shower head, taps and health faucet descaled until every hole runs clear again instead of spraying sideways." },
      { t: "Mirror, exhaust & drains", b: "Mirror and glass finished streak-free, exhaust vent dusted and wiped, drain covers lifted, cleared and put back." },
    ],
  },
  {
    id: "rooms",
    area: "Bedrooms & living",
    shots: ["fan", "window"],
    lede: "Most of the dust in a shut house is sitting above your eye line. We start at the ceiling and work down, so nothing lands on clean floors.",
    steps: [
      { t: "Ceiling, corners & fans", b: "Cobwebs off the ceiling and every corner, fan blades wiped on both faces — including the top edge you only see from a stool." },
      { t: "Walls, switchboards & skirting", b: "Reachable walls dry-dusted, switchboards and light fixtures wiped, skirting run end to end around every room." },
      { t: "Windows, glass & grills", b: "Glass on both sides wherever it is safe to reach, tracks vacuumed out, grills and mosquito mesh brushed down." },
      { t: "Furniture & wardrobes", b: "Exteriors, tops, handles and legs wiped; beds and heavy furniture moved wherever two people can do it safely." },
      { t: "Floor", b: "Machine-scrubbed or hand-scrubbed to whatever finish your floor takes — marble, vitrified, wood — then mopped with disinfectant." },
    ],
  },
  {
    id: "soft",
    area: "Sofa & mattress",
    shots: ["sofa", "mattress"],
    lede: "Four steps, in this order. Skip the wet vacuum and the shampoo stays in the fabric and attracts dirt faster than before — which is how sofas end up worse after a cheap clean.",
    steps: [
      { t: "Dry vacuuming", b: "Crumbs, dust and grit pulled out of every surface, corner and crevice. Part of both tiers, at no extra cost.", chip: "included" },
      { t: "Foam-based shampooing", b: "Shampoo worked into the fabric to lift stains and old spillage. Fabric only — leather and rexine are wiped and conditioned instead.", chip: "add-on · ₹449 a mattress, ₹549–₹899 a sofa" },
      { t: "Wet vacuuming", b: "The shampoo, and everything it lifted, is vacuumed straight back out and the water wiped down." },
      { t: "Drying", b: "Four to five hours under a fan. Your inspector sets the fans and opens the windows before leaving, and the report tells you when it was done." },
    ],
  },
  {
    id: "balcony",
    area: "Balcony & utility",
    shots: ["balcony", "floor"],
    lede: "The part of the house that takes a year of weather and never gets touched.",
    steps: [
      { t: "Railings & grills", b: "Dust, bird mess and monsoon grime scrubbed off railings, grills and the parapet, inside face and out." },
      { t: "Floor & drain", b: "Floor machine-scrubbed, moss and water staining lifted, drain cover pulled up and cleared so the next rain runs off." },
      { t: "Washing area", b: "Utility sink and the slab around the machine descaled, shelves and racks wiped, everything put back where it stood." },
    ],
  },
];

export const shotLabel: Record<ShotName, string> = {
  chimney: "Chimney filter", stove: "Hob & burner", slab: "Slab & backsplash", fridge: "Fridge interior",
  grout: "Tiles & grout", wc: "WC", shower: "Shower head",
  floor: "Floor", fan: "Ceiling fan", window: "Window glass",
  sofa: "Fabric sofa", mattress: "Mattress", balcony: "Balcony floor",
};

/* The wall of proof, in the order a deep clean actually happens. */
export const shotWall: { name: ShotName; label: string; time: [string, string] }[] = [
  { name: "chimney", label: "Kitchen · chimney filter", time: ["11:06", "14:22"] },
  { name: "stove", label: "Kitchen · hob & burner", time: ["11:09", "14:18"] },
  { name: "slab", label: "Kitchen · slab & backsplash", time: ["11:12", "14:40"] },
  { name: "fridge", label: "Kitchen · fridge interior", time: ["11:20", "13:55"] },
  { name: "grout", label: "Bathroom 1 · tiles & grout", time: ["11:44", "15:02"] },
  { name: "wc", label: "Bathroom 1 · WC", time: ["11:46", "15:05"] },
  { name: "shower", label: "Bathroom 2 · shower head", time: ["12:02", "15:11"] },
  { name: "floor", label: "Living · floor scrubbing", time: ["12:30", "15:26"] },
  { name: "fan", label: "Bedroom 2 · ceiling fan", time: ["12:48", "14:04"] },
  { name: "window", label: "Living · window glass", time: ["13:02", "15:18"] },
  { name: "sofa", label: "Living · fabric sofa", time: ["13:20", "15:40"] },
  { name: "mattress", label: "Bedroom 1 · mattress", time: ["13:36", "15:44"] },
  { name: "balcony", label: "Balcony · floor & railing", time: ["13:50", "15:52"] },
];

/* ── Who physically sends the crew ────────────────────────────────
   Set `partner` to their name ONLY once the arrangement is real and in
   writing: this renders on the live site as a factual claim about who
   does the work, and a claim of partnership you don't have is the one
   thing that can get the page taken down. Null renders a neutral
   description instead, which is true either way.

   There is deliberately no logo field. Using a company's NAME to say
   truthfully who performs the service is nominative use; putting their
   LOGO on your page asserts an endorsement, and that needs their written
   brand permission. Get it first, then add it here. */
export const fulfilment: { partner: string | null } = { partner: null };

export const crew = (partner: string | null) => [
  {
    t: "Who does the cleaning",
    b: partner
      ? `A professional crew from ${partner}, booked and paid for by us on your date. You never deal with them, never pay them, and never chase them.`
      : "A professional crew from a vetted cleaning company, booked and paid for by us on your date. You never deal with them, never pay them, and never chase them.",
  },
  {
    t: "Who opens the door",
    b: "Your inspector. That is the part none of them can solve — every cleaning company needs somebody at home at 10 a.m., and from another country that person does not exist. Ours goes in on your OTP.",
  },
  {
    t: "Who checks the work",
    b: "Also your inspector, on site for the whole job, photographing every room before the crew starts and after they finish. If a surface isn't done, it gets redone before anyone leaves.",
  },
  {
    t: "Who is accountable",
    b: "We are. One number, one bill, one company to come back to. A missed skirting board is our problem to fix, not a support ticket you argue about from another timezone.",
  },
];

/* ── The part no cleaning app has ────────────────────────────── */
export const finish = [
  { t: "Before and after, every room", b: "Each room photographed from the same spot before the crew starts and after they finish. You judge the work yourself instead of trusting a completion tick." },
  { t: "The full inspection runs alongside", b: "This is not a cleaner ticking boxes. Your inspector runs the 42-item checklist while the crew works — leaks, damp, electricals, locks, the lot." },
  { t: "Whatever the clean uncovers, you get told", b: "Moving a sofa finds a damp patch; descaling a tap finds a slow leak. It goes into the report with a photo and a quote, and nothing is touched until you say yes." },
  { t: "An exit walkthrough on video", b: "The inspector films the whole house on the way out, GPS and time stamped, before the door is locked." },
];

/* ── Refresh vs deep, line by line ───────────────────────────── */
export const compare: { l: string; r: string | boolean; d: string | boolean }[] = [
  { l: "Cobwebs, ceiling corners & fan dusting", r: true, d: true },
  { l: "Floors swept and mopped with disinfectant", r: true, d: true },
  { l: "Floors machine-scrubbed", r: false, d: true },
  { l: "Surfaces, sills & wardrobe fronts", r: "wiped", d: "wiped & degreased" },
  { l: "Switchboards, fixtures & skirting", r: "dusted", d: "wiped down" },
  { l: "Kitchen slab, sink & backsplash", r: "wiped", d: "descaled & degreased" },
  { l: "Stove & hob", r: "wiped", d: "burner pores cleared" },
  { l: "Cabinet exteriors", r: true, d: true },
  { l: "Bathroom tiles & grout", r: "surfaces wiped", d: "machine-scrubbed" },
  { l: "WC", r: "cleaned", d: "descaled inside & out" },
  { l: "Taps & shower heads", r: "run and wiped", d: "descaled" },
  { l: "Window glass, tracks & grills", r: false, d: true },
  { l: "Doors, handles & light fittings", r: false, d: true },
  { l: "Balcony floor & railings", r: "swept", d: "scrubbed" },
  { l: "Sofa & mattress dry vacuuming", r: false, d: true },
  { l: "Every tap and trap run so seals don't dry", r: true, d: true },
  { l: "Before & after photo of every room", r: true, d: true },
  { l: "Verified inspector on site the whole time", r: true, d: true },
  { l: "Full 42-item inspection + report within the hour", r: true, d: true },
];

/* ── What is included, what is not ───────────────────────────── */
export const included = [
  { t: "Room floor scrubbing", b: "Machine on the open floor, hand scrubber in the corners" },
  { t: "Ceiling, corners & fan dusting", b: "Both faces of every blade, including the top edge" },
  { t: "Cabinets & furniture exteriors", b: "Fronts, tops, handles, legs and shutter edges" },
  { t: "Doors, windows & mirrors", b: "Glass both sides where safe, tracks vacuumed, mesh brushed" },
  { t: "Switchboards & fixtures", b: "Wiped down dry, plates and light fittings included" },
  { t: "Kitchen sink, tiles & slabs", b: "Descaled to the metal, grout between tiles brushed" },
  { t: "Stove & hob", b: "Stovetop, knobs and burner pores cleared" },
  { t: "Sofa & mattress dry vacuuming", b: "Every surface, corner and crevice" },
  { t: "Bathroom floor & grout scrubbing", b: "Machine on the floor, grout brush on every line" },
  { t: "Toilet seat & fixtures", b: "Bowl, rim, seat, hinges, cistern and pipework" },
  { t: "Balcony floor & railings", b: "Scrubbed, drains cleared, parapet wiped" },
  { t: "Waste cleared & house aired", b: "Bins emptied, windows opened, fans set before we lock up" },
];

export const excluded = [
  "Removal of glue, paint stains, stickers or dried cement marks",
  "Terrace cleaning and anything needing a ladder past ten feet",
  "Wet wiping of walls and ceilings — paint won't take water, so these are dry-dusted",
  "Exterior glass on upper floors without balcony access — unsafe to reach, and nobody should try",
  "Dishwashing, laundry and sorting personal belongings",
  "Pest control, painting, polishing and any civil or plumbing repair",
  "Moving heavy furniture that needs more than two people",
];

export const notes = [
  "Residential properties only, with no ongoing construction or renovation running.",
  "Leather and rexine sofas are wiped and conditioned, not shampooed — water damages them.",
  "Stains set into fabric, grout or stone may lighten rather than vanish. The before/after photo shows you exactly how far it went, and we never claim more than that.",
];

/* ── Kit ─────────────────────────────────────────────────────── */
export const kit = [
  "Floor scrubbing machine",
  "Dry & wet vacuum cleaner",
  "Hand scrubber + attachments",
  "Microfibre cloths & sponges",
  "Degreaser, descaler & disinfectant",
  "Grout brushes & detail brushes",
  "Squeegee, wiper & dusting broomstick",
  "Our own ladder, buckets and extension lead",
];

/* The positioning line of the entire page. Every cleaning app in the
   country asks the customer for a bucket, a power point, a ladder —
   and for somebody to be standing at the door at 10 a.m. An owner
   abroad has none of those. So we bring the first three and we are
   the fourth. */
export const bringVsNeed = {
  weBring: kit,
  youDo: [
    { t: "Pick a date", b: "Two or three days before you land is ideal, so anything broken can be fixed before you walk in." },
    { t: "Share one OTP", b: "The inspector's app only opens with it. No keys couriered, no spare set left with a neighbour, no code on WhatsApp." },
    { t: "Read the report", b: "It reaches you within the hour of the visit — before and after photos, the checklist, and anything that needs your yes." },
  ],
  onSite: "We only need a working water supply and one power point. Your inspector checks both at the start of the visit and tells you before the crew begins — if the supply is dead, we reschedule and you pay nothing.",
};

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
