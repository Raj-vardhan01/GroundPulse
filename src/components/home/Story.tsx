"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { HealthRing } from "@/components/ui/HealthRing";
import { EASE, viewportOnce } from "@/lib/motion";

function Chat() {
  return (
    <div className="space-y-2 pt-1">
      <div className="ml-auto w-fit max-w-[88%] rounded-[16px] rounded-br-[4px] bg-[#dcf8c6] px-3 py-2 text-[12.5px] leading-snug">Bhaiya sab theek hai, tension mat lo 👍<div className="mt-0.5 text-right text-[9px] text-ink/50">11:42 PM ✓✓</div></div>
      <div className="w-fit rounded-[16px] rounded-bl-[4px] bg-white px-3 py-2 text-[12.5px] leading-snug shadow-card">…and the bathroom leak?<div className="mt-0.5 text-[9px] text-ink/50">seen 11:58 PM</div></div>
      <div className="w-fit rounded-[16px] rounded-bl-[4px] bg-white px-3 py-2 text-[12.5px] leading-snug text-ink/45 shadow-card">…photo bhej do?<div className="mt-0.5 text-[9px] text-ink/40">delivered · 3 days ago</div></div>
    </div>
  );
}

export function Story() {
  return (
    <section className="section pb-0 md:pb-0" aria-labelledby="story-title">
      <div className="wrap">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <SectionHead title={<span id="story-title">Your home is full of memories. Someone should be checking on it.</span>} lede="Millions of people own a home they can't check on — NRIs, people who moved to another city, and investors. Today the only update they get is a thumbs-up on WhatsApp. Small leaks turn into big bills. And every few months, an anxious flight home just to look." />
          </div>
          <div className="relative h-[400px] sm:h-[440px] lg:col-span-7">
            {/* tilted phone with the chat */}
            <motion.div initial={{ opacity: 0, y: 30, rotate: 0 }} whileInView={{ opacity: 1, y: 0, rotate: -4 }} viewport={viewportOnce} transition={{ duration: 1, delay: 0.1, ease: EASE }} className="card absolute left-[2%] top-2 w-[290px] bg-beige-2 p-4 shadow-float sm:left-[8%] sm:w-[320px] lg:left-[4%]">
              <div className="flex items-center justify-between text-[12px] font-medium text-text-2"><span>Sharma ji (neighbour)</span><span>WhatsApp</span></div>
              <Chat />
            </motion.div>
            {/* the record, leaning the other way */}
            <motion.div initial={{ opacity: 0, y: 30, rotate: 0 }} whileInView={{ opacity: 1, y: 0, rotate: 4 }} viewport={viewportOnce} transition={{ duration: 1, delay: 0.35, ease: EASE }} className="card absolute right-[2%] top-[42%] w-[280px] bg-white p-4 shadow-float sm:right-[8%] sm:w-[300px] lg:right-[4%]">
              <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-text-2">Inspection report</span><span className="chip chip-pass h-6 text-[10px]">Ready</span></div>
              <div className="mt-3 flex items-center gap-3">
                <HealthRing score={84} size={60} stroke={6} delay={0.8} />
                <div><div className="text-[14px] font-medium">Ancestral Apartment</div><div className="text-[12px] text-text-2">42 items · 39 pass · 2 attention · 1 fail</div></div>
              </div>
              <div className="mt-3 rounded-[10px] bg-fail-soft px-3 py-2 text-[12px]"><span className="font-medium text-[#b03434]">Fail</span> · Bathroom · Water leakage · 2 photos, 1 video</div>
              <div className="mt-2 text-[11px] text-text-2">14:02:31 IST · Ravi K. · verified inspector</div>
            </motion.div>
            <div className="hand absolute bottom-0 left-[8%] -rotate-3 text-[20px] text-text-2 sm:left-[14%] sm:text-[22px]">a thumbs-up is not a report →</div>
          </div>
        </div>
        <Reveal className="mt-10"><div className="rule" /></Reveal>
      </div>
    </section>
  );
}
