"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

import { faqs } from "@/lib/faq";

/** On a phone the first few questions show and the rest are one tap away. */
const PHONE_SHOWS = 6;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [all, setAll] = useState(false);
  return (
    <section className="wrap" aria-labelledby="faq-title">
      <Reveal>
        <div className="panel bg-paper px-5 pb-10 pt-10 sm:px-10 md:px-16 md:pb-16 md:pt-16">
          <div className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-14">
            <h2 id="faq-title" className="t-1 max-w-[10ch]">Frequently asked questions</h2>
            <ul className="divide-y divide-line border-t border-line">
              {faqs.map((f, i) => {
                const on = open === i;
                return (
                  <li key={f.q} className={cn(!all && i >= PHONE_SHOWS && "max-sm:hidden")}>
                    <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 py-4 text-left sm:gap-6 sm:py-5">
                      <span className="text-[16px] font-medium leading-snug tracking-[-0.01em] sm:text-[20px]">{f.q}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-beige text-ink">{on ? <Minus size={15} /> : <Plus size={15} />}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                          <p className="t-body max-w-[62ch] pb-5 text-text-2 sm:pb-6">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
            {faqs.length > PHONE_SHOWS && (
              <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="-mt-4 inline-flex items-center gap-1.5 justify-self-start text-[14.5px] font-medium text-accent sm:hidden">
                {all ? "Show fewer" : `All ${faqs.length} questions`}
                <ChevronDown size={16} className={cn("transition-transform", all && "rotate-180")} />
              </button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
