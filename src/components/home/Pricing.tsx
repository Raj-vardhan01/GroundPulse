"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, Check, Home, LandPlot, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { addOns, assets, inr, plans, plotPlans, visitCovers, visitUseCases } from "@/lib/pricing";
import { Relax } from "@/components/shared/Relax";
import { cn } from "@/lib/cn";

const assetIcon = { home: Home, plot: LandPlot, car: Car } as const;
const addOnIcon = { cleaning: Sparkles, deep: Sparkles, car: Car, plot: LandPlot } as const;

export function Pricing({ full }: { full?: boolean }) {
  const [tab, setTab] = useState<"home" | "plot">("home");
  const list = tab === "home" ? plans : plotPlans;
  return (
    <section id="pricing" className="section" aria-labelledby="pricing-title">
      <div className="wrap">
        <SectionHead
          title={<span id="pricing-title">Simple pricing. No surprises.</span>}
          lede="Start with a one-time visit or pick a yearly plan. Every visit is by a verified inspector who stays for the whole job — however long it takes. No brokerage, no commission."
          action={!full ? <Link href="/pricing" className="btn btn-white btn-sm">Full pricing <ArrowRight size={15} /></Link> : undefined}
        />

        {/* what we inspect */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {assets.map((a, i) => {
            const I = assetIcon[a.id as keyof typeof assetIcon];
            return (
              <Reveal key={a.id} delay={i * 0.05}>
                <div className="card flex h-full items-start gap-4 bg-white p-5 shadow-card">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={19} /></span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2"><span className="text-[16px] font-medium">{a.name}</span><span className="chip chip-accent">{a.from}</span></div>
                    <p className="t-small mt-1">{a.b}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* homes / plots toggle */}
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between md:mt-12">
          <div className="inline-flex rounded-[14px] bg-beige p-1" role="tablist" aria-label="Plan type">
            {([["home", "Homes", Home], ["plot", "Plots & land", LandPlot]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("inline-flex h-11 items-center gap-2 rounded-[11px] px-4 text-[15px] font-medium transition", tab === k ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink")}>
                <I size={16} /> {l}
              </button>
            ))}
          </div>
          <p className="t-small">{tab === "home" ? "Apartments, villas, independent houses · up to 2 BHK for cleaning" : "Empty plots, farmland, ancestral land · any size"}</p>
        </div>
        <div className={cn("mt-6 grid gap-4 lg:gap-5", tab === "home" ? "lg:grid-cols-3" : "lg:grid-cols-[1fr_1.5fr]")}>
          {list.map((p, i) => (
            <Reveal key={`${tab}-${p.id}`} delay={i * 0.07}>
              <article className={cn("card relative flex h-full flex-col p-6 sm:p-7", p.popular ? "bg-accent text-white shadow-float lg:-my-3 lg:py-10" : "bg-white shadow-card")}>
                {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-accent-2 shadow-card">Most popular</span>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[20px] font-medium tracking-[-0.02em]">{p.name}</h3>
                    <p className={cn("mt-1 text-[14px]", p.popular ? "text-white/80" : "text-text-2")}>{p.tagline}</p>
                  </div>
                  {p.worth && <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", p.popular ? "bg-white/15 text-white" : "bg-accent-soft text-accent-2")}>{p.worth}</span>}
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[40px] font-medium leading-none tracking-[-0.04em] sm:text-[44px]">{inr(p.price)}</span>
                  <span className={cn("text-[14px]", p.popular ? "text-white/75" : "text-text-2")}>{p.period}</span>
                </div>
                <p className={cn("mt-1 text-[13px]", p.popular ? "text-white/70" : "text-text-2")}>{p.price3 ? "Up to 2 BHK" : ""}{p.period === "per year" ? `${p.price3 ? " · " : ""}≈ ${inr(Math.round(p.price / 12))} a month` : ""}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.includes.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14.5px] leading-snug">
                      <span className={cn("mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full", p.popular ? "bg-white text-accent-2" : "bg-accent-soft text-accent-2")}><Check size={11} strokeWidth={3} /></span>
                      <span className={p.popular ? "text-white/90" : "text-text"}>{t}</span>
                    </li>
                  ))}
                </ul>
                {p.id === "care-plus" && <Link href="/pricing#cover-terms" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent-2 hover:underline">See exactly what the cover includes <ArrowRight size={12} /></Link>}
                {p.price3 && (
                  <div className={cn("mt-6 grid grid-cols-2 gap-2 text-[13px]", "")}>
                    <div className={cn("rounded-[12px] px-3.5 py-2.5", p.popular ? "bg-white/12" : "bg-beige")}><div className={cn("text-[11.5px]", p.popular ? "text-white/70" : "text-text-2")}>3 BHK</div><div className="font-medium">{inr(p.price3)}{p.period === "per year" ? "/yr" : ""}</div></div>
                    <div className={cn("rounded-[12px] px-3.5 py-2.5", p.popular ? "bg-white/12" : "bg-beige")}><div className={cn("text-[11.5px]", p.popular ? "text-white/70" : "text-text-2")}>4 BHK+</div><div className="font-medium">{inr(p.price4 ?? p.price3)}{p.period === "per year" ? "/yr" : ""}</div></div>
                  </div>
                )}
                <Link href={`/access?plan=${p.id}`} className={cn("btn mt-4 w-full", p.popular ? "btn-white" : "btn-accent")}>{p.cta} <ArrowRight size={16} /></Link>
              </article>
            </Reveal>
          ))}
          {tab === "plot" && (
            <Reveal delay={0.1}>
              <div className="card flex h-full flex-col justify-center bg-ink p-6 text-white sm:p-8 md:p-10">
                <p className="text-[16px] font-medium text-white/70">Why owners book it</p>
                <h3 className="t-2 mt-1 max-w-[16ch]">Is anyone sitting on your land?</h3>
                <p className="mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-white/75">Empty plots get occupied, fenced, dumped on and built over — quietly, for years. A verified inspector walks the boundary, photographs every corner with GPS, and shows you exactly what's there today.</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {["Encroachment & occupation", "Boundary markers & fence", "Neighbour construction / dumping", "Notices, road & utility work", "GPS photo of every corner", "Photo map in your report"].map((t) => <li key={t} className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.07] px-3 py-2 text-[13.5px]"><span className="grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={10} strokeWidth={3} /></span>{t}</li>)}
                </ul>
                <p className="mt-5 text-[13px] text-white/60">Same ₹1,999 as a home visit. Book it once, or every quarter — your call.</p>
              </div>
            </Reveal>
          )}
        </div>

        {/* add-ons */}
        <Reveal className="mt-8">
          <div className="card bg-beige p-5 sm:p-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="text-[18px] font-medium tracking-[-0.02em]">Add-ons — on any plan, any visit</div><div className="t-small">Book with a visit, or on their own in between.</div></div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {addOns.map((a) => {
                const I = addOnIcon[a.id as keyof typeof addOnIcon];
                return (
                  <Link key={a.id} href={`/access?plan=${a.id}`} className="card group flex items-start gap-3 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={17} /></span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2"><span className="text-[15px] font-medium">{a.name}</span></div>
                      <div className="text-[20px] font-medium leading-tight tracking-[-0.03em]">{inr(a.price)} <span className="text-[12.5px] font-normal text-text-2">{a.unit}</span></div>
                      <div className="t-small mt-1">{a.note}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* supervised work */}
        <Reveal className="mt-4">
          <div className="card flex flex-col gap-4 bg-accent p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15"><ShieldCheck size={19} /></span>
              <div>
                <div className="text-[17px] font-medium">Cleaning and repairs happen during the visit — with your inspector in the room.</div>
                <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-white/80">Nothing happens behind your back. The cleaning crew or the repair pro works during a scheduled visit while your verified inspector stays on-site the whole time — and the before/after photos land in the same report. Repairs are always the pro's quote + a flat 10% fee, approved by you. No brokerage, no hidden commission.</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* why you can relax */}
        <Reveal className="mt-4">
          <div className="card bg-beige p-5 sm:p-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-[18px] font-medium tracking-[-0.02em]">Why you can relax</div>
              <div className="t-small max-w-[60ch]">Repairs are always the verified pro's quote + a flat 10% fee, approved by you. No brokerage, no hidden commission.</div>
            </div>
            <Relax variant="list" className="mt-5 sm:grid-cols-2" />
          </div>
        </Reveal>

        {full && (
          <>
            {/* what a one-time visit covers */}
            <div className="mt-16 grid gap-8 md:mt-20 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="text-[18px] font-medium text-text-2">One-time visit · {inr(1999)}</p>
                  <h3 className="t-1 mt-1 max-w-[14ch]">What one visit actually covers</h3>
                  <p className="t-body mt-4 max-w-[44ch] text-text-2">Not a walk-around and a vibe. A structured checklist, proof on every item, and a report in your inbox within the hour.</p>
                  <div className="mt-5 flex flex-wrap gap-2">{visitUseCases.map((u) => <span key={u} className="chip">{u}</span>)}</div>
                  <Link href="/access?plan=one-time" className="btn btn-accent mt-7">Book a visit <ArrowRight size={16} /></Link>
                </Reveal>
              </div>
              <Reveal className="lg:col-span-7">
                <ul className="card grid gap-3 bg-white p-6 shadow-card sm:grid-cols-2 sm:p-7">
                  {visitCovers.map((c) => <li key={c} className="flex items-start gap-2.5 text-[14.5px]"><span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent-2"><Check size={11} strokeWidth={3} /></span>{c}</li>)}
                </ul>
              </Reveal>
            </div>

          </>
        )}
      </div>
    </section>
  );
}
