"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/motion";

import { faqs } from "@/lib/faq";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
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
                  <li key={f.q}>
                    <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                      <span className="text-[18px] font-medium tracking-[-0.01em] sm:text-[20px]">{f.q}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-beige text-ink">{on ? <Minus size={15} /> : <Plus size={15} />}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                          <p className="t-body max-w-[62ch] pb-6 text-text-2">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
