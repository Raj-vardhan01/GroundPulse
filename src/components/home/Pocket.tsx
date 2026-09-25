"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { MapCard } from "@/components/ui/MapCard";
import { HealthRing } from "@/components/ui/HealthRing";
import { Mark } from "@/components/ui/Logo";
import { EASE, viewportOnce } from "@/lib/motion";

function PhoneDash() {
  const props = [{ n: "Ancestral Apartment", a: "Indiranagar", s: 84, o: 1 }, { n: "Plot 22 · Devanahalli", a: "Devanahalli · boundary clear", s: 96, o: 0 }, { n: "Garden Villa", a: "Whitefield", s: 62, o: 2 }];
  return (
    <div>
      <div className="flex items-center justify-between"><span className="text-[13px] font-medium">My properties</span><span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-card"><Bell size={13} /></span></div>
      <div className="mt-2 space-y-1.5">
        {props.map((p, i) => (
          <div key={p.n} className="flex items-center gap-2.5 rounded-[12px] bg-white p-2 shadow-card">
            <HealthRing score={p.s} size={38} stroke={4} delay={0.4 + i * 0.12} />
            <div className="min-w-0 flex-1"><div className="truncate text-[11.5px] font-medium">{p.n}</div><div className="text-[10px] text-text-2">{p.a}</div></div>
            {p.o ? <span className={`chip h-5 px-1.5 text-[9px] ${p.o > 1 ? "chip-warn" : "chip-fail"}`}>{p.o} open</span> : <span className="chip chip-pass h-5 px-1.5 text-[9px]">Clear</span>}
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-[12px] bg-accent-tint p-2.5">
        <div className="text-[10px] font-medium text-accent-2">Waiting for you</div>
        <div className="mt-0.5 text-[11.5px] font-medium">Water leakage · Bathroom</div>
        <div className="mt-1.5 grid grid-cols-2 gap-1"><span className="btn btn-accent h-7 px-2 text-[10.5px]"><Check size={10} /> Approve</span><span className="btn btn-white h-7 px-2 text-[10.5px]">Decline</span></div>
      </div>
    </div>
  );
}

export function Pocket() {
  return (
    <section className="section" aria-labelledby="pocket-title">
      <div className="wrap">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:gap-5">
          {/* phone card */}
          <Reveal>
            <div className="card relative overflow-hidden bg-beige p-7 sm:min-h-[520px] sm:p-9">
              <div className="relative z-10 max-w-[30ch]">
                <h2 id="pocket-title" className="t-1">Your home, in your pocket</h2>
                <p className="t-body mt-3 text-text-2">Every flat, villa and plot — every report, every decision — from wherever you are. Approve a repair between meetings.</p>
                <Link href="/owners" className="btn btn-accent btn-sm mt-6">For owners <ArrowRight size={15} /></Link>
              </div>
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 1, delay: 0.2, ease: EASE }} className="relative -mb-16 ml-auto mt-8 w-[min(300px,100%)] sm:absolute sm:-bottom-10 sm:right-8 sm:mb-0 sm:mt-0 sm:w-[330px] md:-bottom-8">
                <div className="card shadow-float bg-white p-4"><PhoneDash /></div>
              </motion.div>
              {/* floating notification, Opendoor-style */}
              <motion.div initial={{ opacity: 0, y: 12, x: 10 }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={viewportOnce} transition={{ duration: 0.8, delay: 1.1, ease: EASE }} className="absolute right-3 bottom-[15rem] z-20 flex sm:bottom-auto sm:top-[44%] items-center gap-3 rounded-[16px] bg-white/95 p-3 pr-4 shadow-float backdrop-blur sm:right-6 md:top-[40%]">
                <span className="relative"><Mark size={34} /><span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-pass text-white"><Check size={9} strokeWidth={3} /></span></span>
                <div><div className="text-[13.5px] font-medium">Your health score just went up!</div><div className="text-[12px] text-text-2">Ancestral Apartment · 71 → 84</div></div>
              </motion.div>
            </div>
          </Reveal>
          {/* map card */}
          <Reveal delay={0.1}>
            <div className="card relative h-[520px] overflow-hidden bg-white shadow-card">
              <MapCard className="h-full !rounded-none !shadow-none" />
              <div className="absolute left-4 top-4 max-w-[360px] rounded-[14px] bg-white/95 p-4 shadow-card backdrop-blur sm:left-5">
                <div className="text-[18px] font-medium tracking-[-0.02em]">Live in Bengaluru</div>
                <p className="t-small mt-1">Homes, plots and cars across the city — Whitefield to Yelahanka. We open a new city only when we have verified inspectors and repair professionals there. Next: Pune, Hyderabad, Jaipur.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
