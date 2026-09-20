"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/motion";

const words = ["inspections", "plot boundary walks", "photo proof", "repair approvals", "the car in the basement", "verified pros"];

/** Opendoor detail: "handles ✓repairs / so you can focus on what matters most" with a rotating word. */
export function Handles() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % words.length), 2200); return () => clearInterval(t); }, []);
  return (
    <section className="pb-4 pt-16 md:pt-24" aria-labelledby="handles-title">
      <div className="wrap">
        <Reveal>
          <h2 id="handles-title" className="t-1">
            <span className="block">Still Yours handles{" "}
              <span className="relative inline-flex items-baseline gap-2 whitespace-nowrap align-baseline text-accent">
                <span className="inline-grid h-[0.8em] w-[0.8em] translate-y-[0.08em] place-items-center rounded-[6px] border-[1.5px] border-accent/50 text-accent"><Check size={14} strokeWidth={3} /></span>
                <span className="relative inline-block overflow-hidden align-baseline" style={{ height: "1.1em" }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={words[i]} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="inline-block">{words[i]}</motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </span>
            <span className="block">so you can focus on what matters most</span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
