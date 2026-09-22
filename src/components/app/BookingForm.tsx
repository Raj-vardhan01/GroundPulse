"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Car, Check, ClipboardCheck, Clock, LandPlot, MapPin, Minus, Plus, Sparkles, Video } from "lucide-react";
import { bookVisit, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { quote, SLOTS, inr } from "@/lib/quote";
import { plans } from "@/lib/pricing";
import { tiers, bhkLabel } from "@/lib/cleaning";
import { cn } from "@/lib/cn";
import type { Property, VisitKind } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/* Two clear days before the first bookable date: an inspector has to be
   found, briefed and physically got to the address. Promising tomorrow
   and missing it is worse than saying Thursday. */
const days = Array.from({ length: 28 }, (_, i) => new Date(Date.now() + (i + 2) * 86_400_000));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const Group = ({ n, title, lede, children }: { n: number; title: string; lede?: string; children: React.ReactNode }) => (
  <section className="card border border-line bg-white p-5 shadow-card sm:p-6">
    <div className="flex items-baseline gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-tint font-mono text-[11px] font-semibold text-accent">{n}</span>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
        {lede && <p className="t-small mt-0.5">{lede}</p>}
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

export function BookingForm({ properties, initialProperty, welcome = false }: { properties: Property[]; initialProperty?: string; welcome?: boolean }) {
  const [state, submit] = useActionState(bookVisit, { ok: false } as FormState);
  const [propertyId, setPropertyId] = useState(initialProperty && properties.some((p) => p.id === initialProperty) ? initialProperty : properties[0]?.id ?? "");
  const property = properties.find((p) => p.id === propertyId)!;
  const isPlot = property?.kind === "plot";

  const [service, setService] = useState<VisitKind>("inspection");
  const [planId, setPlanId] = useState("care");
  const [tierId, setTierId] = useState<"refresh" | "deep">("refresh");
  const [adds, setAdds] = useState<Record<string, number>>({});
  const [date, setDate] = useState(iso(days[2]));
  const [slot, setSlot] = useState(SLOTS[1]);
  const [liveCall, setLiveCall] = useState(false);

  const kind: VisitKind = isPlot ? "plot" : service;
  const size = property?.size ?? "2";
  const q = useMemo(() => quote({ kind, planId, size, tierId: kind === "cleaning" ? tierId : "", addOns: adds }), [kind, planId, size, tierId, adds]);

  const bump = (k: string, d: number, max = 4) =>
    setAdds((a) => { const n = Math.max(0, Math.min(max, (a[k] ?? 0) + d)); const next = { ...a }; if (n) next[k] = n; else delete next[k]; return next; });

  if (!properties.length) {
    return (
      <div className="card border border-line bg-white p-8 text-center shadow-card">
        <p className="t-body">Add a property first — we need to know where an inspector is going.</p>
        <Link href="/app/properties/new" className="btn btn-accent mt-5"><Plus size={16} /> Add a property</Link>
      </div>
    );
  }

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="planId" value={kind === "plot" ? "plot-once" : kind === "cleaning" ? "cleaning" : planId} />
      <input type="hidden" name="tierId" value={kind === "cleaning" ? tierId : ""} />
      <input type="hidden" name="scheduledFor" value={date} />
      <input type="hidden" name="slot" value={slot} />
      {["cleaning", "deep", "car"].map((k) => <input key={k} type="hidden" name={`add_${k}`} value={adds[k] ?? 0} />)}

      <div className="grid gap-4">
        {/* 1 — where */}
        <Group n={1} title="Which property?">
          <div className="grid gap-2">
            {properties.map((p) => (
              <button key={p.id} type="button" onClick={() => { setPropertyId(p.id); setAdds({}); }}
                className={cn("flex items-center gap-3 rounded-[14px] border p-4 text-left transition", propertyId === p.id ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", propertyId === p.id ? "bg-accent text-white" : "bg-beige text-text-2")}>
                  {p.kind === "plot" ? <LandPlot size={17} /> : <MapPin size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{p.label}</span>
                  <span className="t-small block truncate">{p.address}</span>
                </span>
                <span className="chip shrink-0">{p.kind === "plot" ? "Plot" : bhkLabel[p.size]}</span>
              </button>
            ))}
            <Link href="/app/properties/new" className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-2 text-[13.5px] font-semibold text-text-2 transition hover:border-ink hover:text-ink"><Plus size={14} /> Add another property</Link>
          </div>
        </Group>

        {/* 2 — what */}
        {!isPlot && (
          <Group n={2} title="What should we do?" lede="An inspection is a person walking every room. A clean is the crew, with your inspector on site the whole time.">
            <div className="grid grid-cols-2 gap-2">
              {([["inspection", "Inspection", ClipboardCheck], ["cleaning", "Cleaning", Sparkles]] as const).map(([k, l, I]) => (
                <button key={k} type="button" onClick={() => setService(k)}
                  className={cn("flex items-center gap-2.5 rounded-[14px] border px-4 py-3.5 text-left transition", service === k ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper")}>
                  <I size={17} className={service === k ? "text-accent" : "text-text-3"} />
                  <span className="text-[15px] font-semibold">{l}</span>
                </button>
              ))}
            </div>

            {service === "inspection" ? (
              <div className="mt-4 grid gap-2">
                {plans.map((p) => {
                  const price = quote({ kind: "inspection", planId: p.id, size, tierId: "", addOns: {} }).total;
                  const on = planId === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPlanId(p.id)}
                      className={cn("rounded-[14px] border p-4 text-left transition", on ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[15.5px] font-semibold">{p.name}</span>
                            {p.popular && <span className="chip chip-accent">Most chosen</span>}
                          </div>
                          <p className="t-small mt-1 leading-snug">{p.tagline}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[17px] font-medium tabular-nums">{inr(price)}</div>
                          <div className="t-small">{p.period}</div>
                        </div>
                      </div>
                      {on && (
                        <ul className="mt-3 grid gap-1.5 border-t border-accent/15 pt-3">
                          {p.includes.slice(0, 4).map((x) => (
                            <li key={x} className="flex gap-2 text-[13px] leading-snug text-accent-2"><Check size={13} className="mt-0.5 shrink-0" /> {x}</li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {tiers.map((t) => {
                  const on = tierId === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setTierId(t.id)}
                      className={cn("rounded-[14px] border p-4 text-left transition", on ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[15.5px] font-semibold">{t.name}</div>
                          <p className="t-small mt-1 leading-snug">{t.pick}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[17px] font-medium tabular-nums">{inr(t.price[size])}</div>
                          <div className="t-small">{t.hours[size]} · crew of {t.crew[size]}</div>
                        </div>
                      </div>
                      {on && <p className="mt-3 border-t border-accent/15 pt-3 text-[13px] leading-snug text-accent-2">{t.doesnt}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </Group>
        )}

        {/* 3 — extras */}
        {kind !== "cleaning" && (
          <Group n={isPlot ? 2 : 3} title="Anything else while they are there?" lede="Added to a visit somebody is already making, so it costs what it adds — not the full standalone price.">
            <div className="grid gap-2">
              {!isPlot && tiers.map((t) => (
                <Counter key={t.id} on={!!adds[t.id === "refresh" ? "cleaning" : "deep"]} I={Sparkles}
                  title={t.name} note={`${t.hours[size]} · ${t.tagline.toLowerCase().replace(/\.$/, "")}`}
                  price={inr(t.rider[size])} n={adds[t.id === "refresh" ? "cleaning" : "deep"] ?? 0}
                  onChange={(d) => bump(t.id === "refresh" ? "cleaning" : "deep", d, 2)} />
              ))}
              <Counter on={!!adds.car} I={Car} title="Car inspection" note="Started & idled, battery, tyres, leaks, odometer photo"
                price={inr(700)} n={adds.car ?? 0} onChange={(d) => bump("car", d, 4)} />
            </div>
          </Group>
        )}

        {/* 4 — when */}
        <Group n={isPlot ? 3 : 4} title="When?" lede="Pick a day and a window. We give the inspector the whole window, so nobody is rushed out of a room.">
          <div className="hscroll -mx-1 px-1 pb-1">
            {days.map((dd) => {
              const key = iso(dd);
              const on = date === key;
              const first = dd.getDate() === 1 || key === iso(days[0]);
              return (
                <button key={key} type="button" onClick={() => setDate(key)}
                  className={cn("grid w-[62px] shrink-0 place-items-center rounded-[14px] border py-2.5 transition", on ? "border-accent bg-accent text-white" : "border-line-2 hover:bg-paper")}>
                  <span className={cn("text-[10.5px] font-semibold uppercase tracking-[0.06em]", on ? "text-white/60" : "text-text-3")}>{first ? MONTHS[dd.getMonth()] : DOW[dd.getDay()]}</span>
                  <span className="mt-0.5 text-[19px] font-medium tabular-nums leading-none">{dd.getDate()}</span>
                  <span className={cn("mt-1 text-[10px]", on ? "text-white/60" : "text-text-3")}>{MONTHS[dd.getMonth()]}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SLOTS.map((s) => (
              <button key={s} type="button" onClick={() => setSlot(s)}
                className={cn("flex h-11 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-medium tabular-nums transition", slot === s ? "border-accent bg-accent-tint text-accent-2" : "border-line-2 text-text-2 hover:bg-paper")}>
                <Clock size={13} /> {s}
              </button>
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[14px] border border-line-2 p-4 transition hover:bg-paper has-[:checked]:border-accent has-[:checked]:bg-accent-tint">
            <input type="checkbox" name="liveCall" checked={liveCall} onChange={(e) => setLiveCall(e.target.checked)} className="peer sr-only" />
            <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition", liveCall ? "border-accent bg-accent text-white" : "border-line-2")}>{liveCall && <Check size={12} strokeWidth={3} />}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[14.5px] font-medium"><Video size={14} /> Call me live during the visit</span>
              <span className="t-small block leading-snug">The inspector rings you from inside the house so you can see a room yourself and ask for another angle.</span>
            </span>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-2">Anything specific to look at?</span>
            <textarea name="notes" rows={2} placeholder="Photograph the north-east survey stone first. Check the geyser in the second bathroom."
              className="w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10" />
          </label>
        </Group>
      </div>

      {/* ── the running total ───────────────────────────────
           Sticky on both, but on a phone it shows only what it has to:
           a full itemised panel pinned to the bottom of a 375px screen
           covers the choices it is meant to be reporting on. */}
      <aside className="sticky bottom-0 z-20 lg:top-[76px] lg:bottom-auto">
        <div className="card border border-line bg-white p-5 shadow-float">
          <div className="t-label hidden lg:block">Your order</div>
          <ul className="mt-3 hidden gap-3 lg:grid">
            {q.lines.map((l) => (
              <li key={l.k} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{l.k}</span>
                  <span className="t-small block leading-snug">{l.note}</span>
                </span>
                <span className="shrink-0 text-[14px] font-medium tabular-nums">{inr(l.v)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between lg:mt-4 lg:border-t lg:border-line lg:pt-4">
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">{q.lines[0]?.k ?? "Total"}</span>
              <span className="t-small block lg:hidden">{q.period} · all in</span>
            </span>
            <span className="text-[24px] font-medium tabular-nums tracking-[-0.03em]">{inr(q.total)}</span>
          </div>
          <p className="t-small mt-1 hidden text-right lg:block">{q.period} · all in, no surprises at the door</p>

          {state.error && <p className="mt-3 rounded-[10px] bg-fail-soft px-3 py-2.5 text-[13px] text-[#b03434]">{state.error}</p>}

          <SubmitButton className="mt-4 w-full" pendingLabel="Booking…">
            {welcome ? "Book my first visit" : "Confirm booking"}
          </SubmitButton>
          <p className="t-small mt-3 hidden leading-snug lg:block">
            Nothing is charged now. We confirm the inspector first, then send the bill — and you can move or cancel the visit free until the day before.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Counter({ on, I, title, note, price, n, onChange }: { on: boolean; I: typeof Car; title: string; note: string; price: string; n: number; onChange: (d: number) => void }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[14px] border p-4 transition", on ? "border-accent bg-accent-tint" : "border-line-2")}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", on ? "bg-accent text-white" : "bg-beige text-text-2")}><I size={16} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">{title}</div>
        <div className="t-small leading-snug">{note} · <b className="text-ink">{price}</b></div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => onChange(-1)} aria-label={`Fewer ${title}`} disabled={!n} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink disabled:opacity-30"><Minus size={13} /></button>
        <span className="w-5 text-center font-mono text-[14px] tabular-nums">{n}</span>
        <button type="button" onClick={() => onChange(1)} aria-label={`More ${title}`} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink"><Plus size={13} /></button>
      </div>
    </div>
  );
}
