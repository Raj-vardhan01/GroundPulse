"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bath, BedDouble, Car, Check, ChefHat, ClipboardCheck, Home, LandPlot, Minus, Plus, Sofa, Sparkles, Sun, Video, Warehouse } from "lucide-react";
import { addOns, inr, plans, plotPlans } from "@/lib/pricing";
import { bhkLabel, tiers as cleanTiers, visitPrice, type BhkKey } from "@/lib/cleaning";
import { CleanConfig } from "@/components/cleaning/CleanConfig";
import { useCleanOrder } from "@/components/cleaning/useCleanOrder";
import { cn } from "@/lib/cn";
import { Relax } from "@/components/shared/Relax";
import { InspectorForm } from "./InspectorForm";
import { EASE } from "@/lib/motion";

type Role = "owner" | "inspector";
type Service = "inspection" | "cleaning";
type Size = "2" | "3" | "4";
const input = "h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10";
const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("block", className)}><span className="mb-1.5 block text-[13px] font-medium text-text-2">{label}</span>{children}</label>
);
const allPlans = [...plans, ...plotPlans];

type RoomKey = "bed" | "bath" | "living" | "kitchen" | "balcony" | "study" | "terrace" | "parking";
/* Caps follow the home size you picked — a 2 BHK can't have 8 bedrooms — and
   `min` keeps the layout physically sensible (every home has one kitchen). */
const roomTypes: { k: RoomKey; l: string; I: typeof BedDouble; min: number; caps: Record<Size, number>; rate: number }[] = [
  { k: "bed", l: "Bedrooms", I: BedDouble, min: 1, caps: { "2": 2, "3": 3, "4": 10 }, rate: 200 },
  { k: "bath", l: "Bathrooms", I: Bath, min: 1, caps: { "2": 3, "3": 4, "4": 10 }, rate: 100 },
  { k: "living", l: "Living / dining", I: Sofa, min: 1, caps: { "2": 2, "3": 2, "4": 7 }, rate: 150 },
  { k: "kitchen", l: "Kitchen", I: ChefHat, min: 1, caps: { "2": 1, "3": 1, "4": 5 }, rate: 150 },
  { k: "balcony", l: "Balconies", I: Sun, min: 0, caps: { "2": 3, "3": 4, "4": 8 }, rate: 75 },
  { k: "study", l: "Study / store", I: Warehouse, min: 0, caps: { "2": 1, "3": 2, "4": 5 }, rate: 100 },
  { k: "terrace", l: "Terrace / garden", I: Sun, min: 0, caps: { "2": 1, "3": 1, "4": 5 }, rate: 125 },
  { k: "parking", l: "Parking (car)", I: Car, min: 0, caps: { "2": 2, "3": 2, "4": 6 }, rate: 75 },
];
const sizeLabel: Record<Size, string> = { "2": "2 BHK", "3": "3 BHK", "4": "4 BHK+" };
/* Add-on ceilings. Cars are capped by the parking you listed (never below 1),
   and a clean can be added once per inspection the plan actually buys. */
const addOnCap = (id: string, parking: number, visits: number) =>
  id === "car" ? Math.max(1, parking) : id === "cleaning" || id === "deep" ? visits : 5;

/* Cleaning is priced on /cleaning as an all-in package — crew, inspector,
   report. Here the inspector is already in the order, so the clean is shown
   for what it actually adds to a visit you are booking anyway. */
const [refreshTier, deepTier] = cleanTiers;
const addOnsFor = (size: Size) =>
  addOns.map((a) => {
    const t = a.id === "cleaning" ? refreshTier : a.id === "deep" ? deepTier : null;
    if (!t) return a;
    return {
      ...a,
      name: t.name,
      price: t.rider[size],
      unit: "added to this visit",
      note: `${t.hours[size]} · ${t.tagline.toLowerCase().replace(/\.$/, "")} · ${inr(t.price[size])} if booked on its own`,
    };
  });
const defaultsFor = (size: Size): Record<RoomKey, number> =>
  size === "2" ? { bed: 2, bath: 2, living: 1, kitchen: 1, balcony: 1, study: 0, terrace: 0, parking: 1 }
  : size === "3" ? { bed: 3, bath: 3, living: 1, kitchen: 1, balcony: 2, study: 0, terrace: 0, parking: 1 }
  : { bed: 4, bath: 4, living: 2, kitchen: 1, balcony: 2, study: 1, terrace: 1, parking: 2 };
const roomOne: Record<RoomKey, string> = { bed: "Bedroom", bath: "Bathroom", living: "Living / dining", kitchen: "Kitchen", balcony: "Balcony", study: "Study / store", terrace: "Terrace / garden", parking: "Parking" };
const roomLabel = (k: RoomKey, i: number, n: number) => (n > 1 ? `${roomOne[k]} ${i + 1}` : roomOne[k]);
/* Care+ carries more per room than Care or a one-off, because every extra room
   also falls under its repair cover. Rounded to ₹25 so no price reads like ₹113. */
const planRateMult = (planId: string) => (planId === "care-plus" ? 1.5 : 1);
const rateAt = (base: number, planId: string) => Math.round((base * planRateMult(planId)) / 25) * 25;
const addOnIcon = { cleaning: Sparkles, deep: Sparkles, car: Car, plot: LandPlot } as const;

export function AccessForm() {
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) || "owner";
  const [role, setRole] = useState<Role>(["owner", "inspector"].includes(initialRole) ? initialRole : "owner");
  const [done, setDone] = useState(false);
  // Switching tabs must clear a previous submission, or an owner who just booked
  // sees "You're on the list." on the (empty) inspector tab.
  const switchRole = (r: Role) => { setRole(r); setDone(false); setSendError(null); };
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const address = params.get("address") || "";

  // owner order state
  const qp = params.get("plan") || "care";
  /* Two things people come here for, and they need different questions.
     A ?plan= of deep/cleaning lands straight on the cleaning side. */
  const qService = params.get("service");
  const [service, setService] = useState<Service>(
    qService === "cleaning" || (!qService && ["deep", "cleaning"].includes(qp)) ? "cleaning" : "inspection"
  );
  const initialAdd: Record<string, number> = {};
  if (["cleaning", "deep", "car", "plot"].includes(qp)) initialAdd[qp] = 1;
  const [planId, setPlanId] = useState(allPlans.some((p) => p.id === qp) ? qp : qp === "plot" ? "plot-once" : "care");
  const qsize = params.get("size");
  const [size, setSize] = useState<Size>(qsize === "3" ? "3" : qsize === "4" || qsize === "5" ? "4" : "2");
  const clean = useCleanOrder((["1", "2", "3", "4", "5"].includes(qsize ?? "") ? qsize : "2") as BhkKey, qp === "cleaning" ? "refresh" : "deep");
  const isClean = service === "cleaning";
  const [adds, setAdds] = useState<Record<string, number>>(initialAdd);
  const [rooms, setRooms] = useState<Record<RoomKey, number>>(defaultsFor("2"));
  const plan = allPlans.find((p) => p.id === planId)!;
  const isPlot = planId === "plot-once";
  const planPrice = isPlot ? plan.price : size === "3" ? plan.price3 ?? plan.price : size === "4" ? plan.price4 ?? plan.price3 ?? plan.price : plan.price;
  const visits = plan.visits ?? 1;
  const rateFor = (base: number) => rateAt(base, planId);

  /* popup confirming the price of a room you just added past the baseline */
  const [toast, setToast] = useState<{ id: number; t: string; b: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const popToast = (t: string, b: string) => {
    seq.current += 1;
    setToast({ id: seq.current, t, b });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  };

  const pickSize = (v: Size) => { setSize(v); setRooms(defaultsFor(v)); setToast(null); };
  /* Everything here runs in the event handler, never inside a state updater —
     updaters must stay pure, and React may call them more than once. */
  const setRoom = (k: RoomKey, d: number) => {
    const t = roomTypes.find((x) => x.k === k)!;
    const cur = rooms[k];
    const next = Math.max(t.min, Math.min(t.caps[size], cur + d));
    if (next === cur) return;
    setRooms((r) => ({ ...r, [k]: next }));
    /* fewer parking slots than cars booked → bring the car add-on back in line */
    if (k === "parking") setAdds((a) => (a.car ? { ...a, car: Math.min(a.car, Math.max(1, next)) } : a));
    /* only rooms past the 4 BHK+ baseline are billable — say so the moment they're added */
    if (d > 0 && size === "4" && next > defaultsFor("4")[k]) {
      const rate = rateFor(t.rate);
      popToast(`${roomOne[k]} ${next} added`, visits > 1 ? `${inr(rate)} per inspection · +${inr(rate * visits)} a year on ${plan.name}` : `+${inr(rate)} on this visit`);
    }
  };
  const slots = roomTypes.flatMap((t) => Array.from({ length: rooms[t.k] }, (_, i) => roomLabel(t.k, i, rooms[t.k])));
  const slotCount = slots.length + 1; // + exit walkthrough

  /* The 2 and 3 BHK tiers are capped at exactly their layout, so only 4 BHK+ can
     exceed its baseline. Rooms past it are quoted per inspection, and a yearly
     plan pays that on each of its visits. */
  const extras = useMemo(() => {
    if (isPlot || size !== "4") return [];
    const base = defaultsFor("4");
    return roomTypes
      .map((t) => ({ t, n: rooms[t.k] - base[t.k] }))
      .filter((x) => x.n > 0)
      .map((x) => { const rate = rateAt(x.t.rate, planId); return { k: x.t.k, l: x.t.l, one: roomOne[x.t.k], n: x.n, rate, perVisit: x.n * rate }; });
  }, [rooms, size, isPlot, planId]);
  const extraPerVisit = extras.reduce((t, e) => t + e.perVisit, 0);
  const extraTotal = extraPerVisit * visits;

  const visitAddOns = useMemo(() => addOnsFor(size), [size]);
  const addTotal = useMemo(() => (isPlot ? 0 : visitAddOns.reduce((t, a) => t + (adds[a.id] || 0) * a.price, 0)), [adds, isPlot, visitAddOns]);
  const total = planPrice + addTotal + extraTotal;
  const setQty = (id: string, d: number) => setAdds((s) => ({ ...s, [id]: Math.max(0, Math.min(addOnCap(id, rooms.parking, visits), (s[id] || 0) + d)) }));


  async function submitOwner(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "owner",
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          livesIn: fd.get("livesIn"),
          address: fd.get("address"),
          propertyType: fd.get("propertyType"),
          preferredDate: fd.get("preferredDate"),
          liveCall: fd.get("liveCall") === "on",
          valuablesAck: fd.get("valuablesAck") === "on",
          company: fd.get("company"),
          service,
          planId,
          size,
          rooms,
          addons: adds,
          estimateInr: total,
          source: typeof window === "undefined" ? "" : window.location.search,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "We could not save that just now.");
      setDone(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "We could not save that just now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pt-[88px] md:pt-[100px]">
      <div className="wrap">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><p className="t-label">Get started</p><h1 className="t-1 mt-1">{role === "inspector" ? "Apply to inspect" : isClean ? "Build your cleaning quote" : "Set up your first visit"}</h1></div>
          <div className="hidden items-center gap-1 rounded-[12px] bg-beige p-1 sm:flex">
            {(["owner", "inspector"] as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => switchRole(r)} className={cn("h-10 rounded-[9px] px-4 text-[14px] font-medium transition", role === r ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink")}>{r === "inspector" ? "Apply as an inspector" : "Owner"}</button>
            ))}
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-[12px] bg-beige p-1 sm:hidden">
          {(["owner", "inspector"] as Role[]).map((r) => (
            <button key={r} type="button" onClick={() => switchRole(r)} className={cn("h-10 rounded-[9px] text-[13px] font-medium transition", role === r ? "bg-white text-ink shadow-card" : "text-text-2")}>{r === "inspector" ? "Inspector" : "Owner"}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="d" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="card mx-auto max-w-[640px] bg-white p-10 text-center shadow-card">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pass text-white"><Check size={28} strokeWidth={3} /></span>
              <h2 className="t-2 mt-6">You're on the list.</h2>
              <p className="t-body mx-auto mt-3 max-w-[44ch] text-text-2">{`We'll confirm your ${isClean ? `${clean.tier.name.toLowerCase()} for a ${bhkLabel[clean.size]}` : plan.name} within a day. Bengaluru is live now — other cities as soon as their verified bench is ready.`}</p>
              <Link href="/" className="btn btn-white mt-8">Back to home</Link>
            </motion.div>
          ) : role === "owner" ? (
            <motion.form key="owner" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} onSubmit={submitOwner} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
              <div className="grid grid-cols-1 gap-6">
                {/* 1. what are you here for */}
                <div className="card bg-white p-6 shadow-card sm:p-7">
                  <h2 className="text-[18px] font-medium">1. What do you need?</h2>
                  <p className="t-small mt-1">Both put a verified inspector in your home and a report in your inbox within the hour. Pick the one you came for — you can add the other on the same visit.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Service">
                    {([
                      ["inspection", "Inspection", ClipboardCheck, "Eyes on the place. A 42-item checklist, photos and video on every item, and quotes for anything broken.", `one visit from ${inr(1999)} · a year of them from ${inr(7999)}`],
                      ["cleaning", "Cleaning", Sparkles, "The house put right. A refresh or a full deep clean, crew supervised by your inspector, before/after photos — and the inspection runs alongside it.", `refresh from ${inr(cleanTiers[0].price["1"])} · deep from ${inr(cleanTiers[1].price["1"])}`],
                    ] as const).map(([v, l, I, b, from]) => {
                      const on = service === v;
                      return (
                        <button type="button" key={v} role="radio" aria-checked={on} onClick={() => setService(v)}
                          className={cn("relative rounded-[16px] border p-5 text-left transition", on ? "border-accent bg-accent-tint ring-4 ring-accent/10" : "border-line-2 hover:border-ink/40")}>
                          <span className={cn("absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border", on ? "border-accent bg-accent text-white" : "border-line-2")}>{on && <Check size={11} strokeWidth={3} />}</span>
                          <div className="flex items-center gap-2 pr-7"><I size={16} className={on ? "text-accent" : "text-text-3"} /><span className="text-[15.5px] font-medium">{l}</span></div>
                          <div className="mt-1.5 text-[13px] font-medium text-text-2">{from}</div>
                          <p className="t-small mt-2 text-[13px] leading-relaxed">{b}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isClean && <CleanConfig o={clean} n={2} />}

                {/* 2. plan */}
                {!isClean && (
                <div className="card bg-white p-6 shadow-card sm:p-7">
                  <div className="flex items-center justify-between"><h2 className="text-[18px] font-medium">2. Pick a plan</h2><Link href="/pricing" className="text-[13px] font-medium text-accent-2 hover:underline">Compare plans</Link></div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
                    {allPlans.map((p) => {
                      const on = planId === p.id;
                      const I = p.id === "plot-once" ? LandPlot : Home;
                      const shown = p.id === "plot-once" ? p.price : size === "3" ? p.price3 ?? p.price : size === "4" ? p.price4 ?? p.price3 ?? p.price : p.price;
                      return (
                        <button type="button" key={p.id} role="radio" aria-checked={on} onClick={() => { setPlanId(p.id); if (p.id === "plot-once") setAdds({}); }} className={cn("relative min-w-0 w-full rounded-[14px] border p-4 text-left transition", on ? "border-accent bg-accent-tint ring-4 ring-accent/10" : "border-line-2 bg-white hover:border-ink/40")}>
                          {p.popular && <span className="absolute -top-2.5 right-3 rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-ink">Most popular</span>}
                          <div className="flex items-center gap-2"><I size={15} className={on ? "text-accent" : "text-text-3"} /><span className="text-[15px] font-medium">{p.name}</span></div>
                          <div className="mt-2 text-[22px] font-medium leading-none tracking-[-0.03em]">{inr(shown)}<span className="ml-1 text-[12px] font-normal text-text-2">{p.period}</span></div>
                          <div className="t-small mt-1.5 pr-2">{p.tagline}</div>
                          <span className={cn("absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border", on ? "border-accent bg-accent text-white" : "border-line-2")}>{on && <Check size={11} strokeWidth={3} />}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* 3. home size */}
                {!isClean && !isPlot && (
                  <div className="card bg-white p-6 shadow-card sm:p-7">
                    <h2 className="text-[18px] font-medium">3. Home size</h2>
                    <p className="t-small mt-1">Prices update automatically with the size of the home.</p>
                    <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Home size">
                      {([["2", "Up to 2 BHK", plan.price], ["3", "3 BHK", plan.price3 ?? plan.price], ["4", "4 BHK+", plan.price4 ?? plan.price3 ?? plan.price]] as const).map(([v, l, pr]) => {
                        const on = size === v;
                        return (
                          <button type="button" key={v} role="radio" aria-checked={on} onClick={() => pickSize(v)} className={cn("rounded-[12px] border px-3 py-3 text-left transition", on ? "border-accent bg-accent-tint ring-4 ring-accent/10" : "border-line-2 hover:border-ink/40")}>
                            <div className="text-[14px] font-medium">{l}</div>
                            <div className="text-[13px] text-text-2">{v === "4" ? "from " : ""}{inr(pr)}{plan.period === "per year" ? "/yr" : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. rooms → inspector slots */}
                {!isClean && !isPlot && (
                  <div className="card bg-white p-6 shadow-card sm:p-7">
                    <h2 className="text-[18px] font-medium">4. Your home, room by room</h2>
                    <p className="t-small mt-1">Every room you add becomes a mandatory video + photo slot in the inspector's app. They can't submit the visit until every slot is filled. Limits follow the {sizeLabel[size]} you picked above.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {roomTypes.map(({ k, l, I, min, caps }) => {
                        const max = caps[size];
                        const atMax = rooms[k] >= max;
                        const atMin = rooms[k] <= min;
                        return (
                          <div key={k} className={cn("flex items-center gap-3 rounded-[12px] border p-3 transition", rooms[k] ? "border-line-2" : "border-line opacity-70")}>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={15} /></span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-medium">{l}</div>
                              {atMax ? <div className="text-[11.5px] text-text-3">max {max} for {sizeLabel[size]}</div> : min > 0 && atMin ? <div className="text-[11.5px] text-text-3">at least {min}</div> : null}
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setRoom(k, -1)} aria-label={`Fewer ${l}`} className="grid h-11 w-11 place-items-center rounded-full border border-line-2 bg-white disabled:opacity-30 sm:h-8 sm:w-8" disabled={atMin}><Minus size={13} /></button>
                              <span className="w-5 text-center text-[14px] font-medium tabular-nums">{rooms[k]}</span>
                              <button type="button" onClick={() => setRoom(k, 1)} aria-label={`More ${l}`} className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white disabled:opacity-30 sm:h-8 sm:w-8" disabled={atMax}><Plus size={13} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* live quote for anything past the 4 BHK+ baseline */}
                    {size === "4" && (
                      <div className={cn("mt-4 rounded-[14px] border p-4 transition", extras.length ? "border-accent bg-accent-tint" : "border-line-2 bg-paper")}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-[14px] font-medium">Beyond the 4 BHK baseline<span className="rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-white">{plan.name} rates</span></span>
                          <span className="text-[12.5px] text-text-2">{inr(planPrice)} covers 4 bed · 4 bath · 2 living · 1 kitchen · 2 balcony · 1 study · 1 terrace · 2 parking</span>
                        </div>
                        {extras.length === 0 ? (
                          <p className="t-small mt-2">Add a room above and it's quoted here instantly — bedrooms {inr(rateFor(200))}, bathrooms {inr(rateFor(100))}, every other room at its own rate, per inspection.{planId === "care-plus" ? " Care+ rates are higher because every extra room falls under its repair cover too." : ""}</p>
                        ) : (
                          <>
                            <ul className="mt-3 space-y-1.5">
                              {extras.map((e) => (
                                <li key={e.k} className="flex items-center justify-between gap-3 text-[13.5px]">
                                  <span className="text-text-2">+{e.n} {e.l.toLowerCase()} × {inr(e.rate)} <span className="text-text-3">per inspection</span></span>
                                  <span className="font-medium tabular-nums">{inr(e.perVisit)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2.5 space-y-1.5 border-t border-accent/20 pt-2.5 text-[13.5px]">
                              <div className="flex items-center justify-between gap-3"><span className="text-text-2">Extra per inspection</span><span className="font-medium tabular-nums">{inr(extraPerVisit)}</span></div>
                              {visits > 1 && (
                                <div className="flex items-center justify-between gap-3"><span className="text-text-2">× {visits} inspections a year on {plan.name}</span><span className="font-medium tabular-nums">{inr(extraTotal)}</span></div>
                              )}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] bg-accent px-3.5 py-2.5 text-white">
                              <span className="text-[13.5px]">Added to your quote{plan.period === "per year" ? " each year" : ""}</span>
                              <span className="text-[17px] font-medium tabular-nums">+{inr(extraTotal)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* generated inspector checklist preview */}
                    <div className="mt-4 rounded-[14px] bg-ink p-4 text-white">
                      <div className="flex items-center justify-between"><span className="text-[13px] font-medium">What the inspector's app will show</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] font-medium">{slotCount} video slots · all required</span></div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {slots.map((sl) => <span key={sl} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px]"><Video size={11} className="text-white/70" /> {sl}</span>)}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[12px]"><Video size={11} /> Exit walkthrough · whole home</span>
                      </div>
                      <p className="mt-3 text-[12px] text-white/60">Each slot needs a full video of that room plus the checklist items — GPS and time-stamped. Skipped slots block submission.</p>
                    </div>
                  </div>
                )}

                {/* 5. add-ons (homes only) */}
                {!isClean && !isPlot && (
                <div className="card bg-white p-6 shadow-card sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[18px] font-medium">5. Add-ons <span className="text-[13px] font-normal text-text-2">(optional)</span></h2>
                    <Link href="/cleaning" className="text-[13px] font-medium text-accent-2 hover:underline">What the cleaning covers</Link>
                  </div>
                  <p className="t-small mt-1">Cleaning is cheaper here than booked on its own — the inspector is already in your order, so you are not paying for two visits.</p>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {visitAddOns.map((a) => {
                      const I = addOnIcon[a.id as keyof typeof addOnIcon];
                      const q = adds[a.id] || 0;
                      const cap = addOnCap(a.id, rooms.parking, visits);
                      const atCap = q >= cap;
                      return (
                        <div key={a.id} className={cn("flex items-center gap-3 rounded-[12px] border p-3 transition", q ? "border-accent bg-accent-tint" : "border-line-2")}>
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={16} /></span>
                          <div className="min-w-0 flex-1"><div className="text-[14.5px] font-medium">{a.name} · {a.id === "cleaning" || a.id === "deep" ? "+" : ""}{inr(a.price)} <span className="text-[12px] font-normal text-text-2">{a.unit}</span></div><div className="t-small truncate">{atCap ? (a.id === "car" ? `Max ${cap} — matches the parking you listed above` : cap === 1 ? "One per visit" : `Max ${cap} — one on each inspection your plan buys`) : a.note}</div></div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setQty(a.id, -1)} aria-label={`Remove ${a.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 bg-white disabled:opacity-30" disabled={!q}><Minus size={13} /></button>
                            <span className="w-5 text-center text-[14px] font-medium tabular-nums">{q}</span>
                            <button type="button" onClick={() => setQty(a.id, 1)} aria-label={`Add ${a.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white disabled:opacity-30" disabled={atCap}><Plus size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* details */}
                <div className="card bg-white p-6 shadow-card sm:p-7">
                  <h2 className="text-[18px] font-medium">{isClean ? "5" : isPlot ? "3" : "6"}. Your details</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name"><input required name="name" className={input} placeholder="Priya Sharma" /></Field>
                    <Field label="Email"><input required name="email" type="email" className={input} placeholder="priya@example.com" /></Field>
                    <Field label="Phone / WhatsApp"><input name="phone" className={input} placeholder="+971 50 000 0000" /></Field>
                    <Field label="You live in"><input name="livesIn" className={input} placeholder="Dubai, UAE" /></Field>
                    <Field label={isPlot ? "Plot address / survey no." : "Property address"} className="sm:col-span-2"><input required name="address" defaultValue={address} className={input} placeholder={isPlot ? "Sy. No. 112, Devanahalli, Bengaluru Rural" : "C-14 Indiranagar, Bengaluru"} /></Field>
                    {!isPlot && <Field label="Property type"><select name="propertyType" className={input} defaultValue="Apartment">{["Apartment", "Villa", "Independent house"].map((o) => <option key={o}>{o}</option>)}</select></Field>}
                    <Field label={isClean ? "Preferred clean date" : "Preferred first visit"}><input name="preferredDate" type="date" className={input} /></Field>
                  </div>
                  <label className="mt-4 flex items-start gap-3 rounded-[12px] bg-accent-tint p-3.5 text-[13.5px]">
                    <input type="checkbox" name="liveCall" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
                    <span><span className="font-medium">Call me live at the start and end of every visit.</span> The inspector video-calls the number above — you, your parents or your caretaker can watch live.</span>
                  </label>
                  <label className="mt-3 flex items-start gap-3 rounded-[12px] bg-paper p-3.5 text-[13.5px]">
                    <input type="checkbox" name="valuablesAck" required className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
                    <span><span className="font-medium">Valuables are locked away.</span> Cash, jewellery and documents are in a locked cupboard or not at the property. Inspectors never open cupboards or lockers, and every visit is protected up to ₹1 lakh under the Still Yours Guarantee.</span>
                  </label>
                </div>
              </div>

              {/* summary */}
              <aside className="card min-w-0 bg-ink p-6 text-white sm:p-7 lg:sticky lg:top-[92px]">
                <div className="text-[13px] font-medium text-white/60">{isClean ? "Your clean" : "Your order"}</div>
                {isClean ? (
                  <>
                    <div className="mt-3 divide-y divide-white/10">
                      <div className="flex items-start justify-between gap-3 py-3">
                        <div>
                          <div className="text-[15px] font-medium">{clean.tier.name} · {bhkLabel[clean.size]}</div>
                          <div className="text-[12.5px] text-white/60">{clean.cov.bed} bed · {clean.cov.bath} bath · {clean.cov.balcony} balcony · living · kitchen</div>
                        </div>
                        <div className="shrink-0 text-[15px] font-medium tabular-nums">{inr(clean.base)}</div>
                      </div>
                      <div className="flex items-start justify-between gap-3 py-3">
                        <div>
                          <div className="text-[15px] font-medium">Verified inspector, whole visit</div>
                          <div className="text-[12.5px] text-white/60">42-item checklist, before/after photos, report within the hour</div>
                        </div>
                        <div className="shrink-0 text-[13px] text-white/60">included</div>
                      </div>
                      {clean.picked.map(({ e, n }) => (
                        <div key={e.id} className="flex items-start justify-between gap-3 py-3">
                          <div>
                            <div className="text-[15px] font-medium">{e.name}{n > 1 ? ` × ${n}` : ""}</div>
                            <div className="text-[12.5px] text-white/60">{inr(e.price)} {e.per ?? "one-off"}</div>
                          </div>
                          <div className="shrink-0 text-[15px] font-medium tabular-nums">{inr(e.price * n)}</div>
                        </div>
                      ))}
                      <div className="flex items-end justify-between gap-3 py-4">
                        <div className="text-[14px] text-white/70">Total, all in</div>
                        <div className="text-[30px] font-medium leading-none tracking-[-0.04em] tabular-nums">{inr(clean.total)}</div>
                      </div>
                    </div>
                    <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" /><button type="submit" disabled={sending} className="btn btn-accent w-full disabled:opacity-50">{sending ? "Sending…" : <>Confirm {clean.tier.name.toLowerCase()} <ArrowRight size={16} /></>}</button>{sendError && <p role="alert" className="mt-3 rounded-[10px] bg-[#fbe6e6] p-3 text-[13px] text-[#8a2a2a]">{sendError} Please email stillyours.care@gmail.com and we will pick it up straight away.</p>}
                    <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                      Nobody needs to be home — your inspector goes in once you confirm on WhatsApp. Inspection on its own for a {bhkLabel[clean.size]} is {inr(visitPrice[clean.size])}; booked with a visit you already have, this clean is +{inr(clean.tier.rider[clean.size])}.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mt-3 divide-y divide-white/10">
                      <div className="flex items-start justify-between gap-3 py-3">
                        <div><div className="text-[15px] font-medium">{plan.name}</div><div className="text-[12.5px] text-white/60">{isPlot ? "One boundary visit" : size === "2" ? "Up to 2 BHK" : size === "3" ? "3 BHK" : "4 BHK+"}{plan.period === "per year" ? " · yearly" : ""}</div></div>
                        <div className="text-[15px] font-medium">{inr(planPrice)}</div>
                      </div>
                      {!isPlot && (
                        <div className="flex items-start justify-between gap-3 py-3">
                          <div><div className="text-[15px] font-medium">{slots.length} rooms · {slotCount} video slots</div><div className="text-[12.5px] text-white/60">Inspector must fill every slot before submitting</div></div>
                          <div className="text-[13px] text-white/60">included</div>
                        </div>
                      )}
                      {!isPlot && extraTotal > 0 && (
                        <div className="py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-[15px] font-medium">Extra rooms past 4 BHK</div>
                            <div className="text-[15px] font-medium">{inr(extraTotal)}</div>
                          </div>
                          <ul className="mt-2 space-y-1.5">
                            {extras.map((e) => (
                              <li key={e.k} className="flex items-baseline justify-between gap-3 text-[12.5px] text-white/60">
                                <span>+{e.n} × {e.one}{e.n > 1 ? "s" : ""} <span className="text-white/40">@ {inr(e.rate)}</span></span>
                                <span className="tabular-nums">{inr(e.perVisit)}</span>
                              </li>
                            ))}
                            <li className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-1.5 text-[12.5px] text-white/60">
                              <span>{inr(extraPerVisit)} per inspection{visits > 1 ? ` × ${visits} a year` : ""}</span>
                              <span className="tabular-nums font-medium text-white/80">{inr(extraTotal)}</span>
                            </li>
                          </ul>
                        </div>
                      )}
                      {!isPlot && visitAddOns.filter((a) => adds[a.id]).map((a) => (
                        <div key={a.id} className="flex items-start justify-between gap-3 py-3">
                          <div><div className="text-[15px] font-medium">{a.name} × {adds[a.id]}</div><div className="text-[12.5px] text-white/60">{inr(a.price)} {a.unit}</div></div>
                          <div className="text-[15px] font-medium">{inr(a.price * adds[a.id])}</div>
                        </div>
                      ))}
                      <div className="flex items-end justify-between gap-3 py-4">
                        <div className="text-[14px] text-white/70">Total</div>
                        <div className="text-[30px] font-medium leading-none tracking-[-0.04em]">{inr(total)}</div>
                      </div>
                    </div>
                    <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" /><button type="submit" disabled={sending} className="btn btn-accent mt-2 w-full disabled:opacity-50">{sending ? "Sending…" : <>Confirm {plan.name} <ArrowRight size={16} /></>}</button>{sendError && <p role="alert" className="mt-3 rounded-[10px] bg-[#fbe6e6] p-3 text-[13px] text-[#8a2a2a]">{sendError} Please email stillyours.care@gmail.com and we will pick it up straight away.</p>}
                    <p className="mt-3 text-[12px] leading-relaxed text-white/75">Launch offer: the first ten owners get their first inspection free — we&apos;ll confirm on WhatsApp.</p>
                    <p className="mt-2 text-[12px] text-white/55">Live in Bengaluru · report within the hour · cancel a yearly plan within 30 days for a 75% refund</p>
                  </>
                )}
                <div className="mt-5 border-t border-white/10 pt-5"><Relax variant="dark" /></div>
              </aside>
            </motion.form>
          ) : (
            <InspectorForm key="inspector" />
          )}
        </AnimatePresence>
      </div>
      <div className="h-16 md:h-24" />

      {/* price popup when a billable room is added */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="pointer-events-none fixed inset-x-4 bottom-5 z-50 mx-auto w-fit max-w-[calc(100vw-2rem)]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 rounded-full bg-ink py-2.5 pl-2.5 pr-5 shadow-float">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-white"><Plus size={14} strokeWidth={3} /></span>
              <span className="text-[13.5px] font-medium text-white">{toast.t}</span>
              <span className="hidden text-[12.5px] text-white/60 sm:inline">{toast.b}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
