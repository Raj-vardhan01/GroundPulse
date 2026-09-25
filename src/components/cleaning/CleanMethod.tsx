"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check } from "lucide-react";
import { BeforeAfter } from "./Shots";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { extraById, finish, inr, method, shotLabel } from "@/lib/cleaning";

/** Room-by-room method. Tabs, because the detail matters but seven
    areas stacked vertically is a wall nobody reads. */
export function CleanMethod() {
  const [active, setActive] = useState(method[0].id);
  const area = method.find((m) => m.id === active)!;

  return (
    <div>
      <div className="hscroll -mx-1 px-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Cleaning method by area">
        {method.map((m) => {
          const on = active === m.id;
          return (
            <button key={m.id} role="tab" aria-selected={on} onClick={() => setActive(m.id)}
              className={cn("h-11 rounded-full px-5 text-[14.5px] font-medium transition", on ? "bg-ink text-white" : "bg-white text-text-2 shadow-card hover:text-ink")}>
              {m.area}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={area.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}
          className="card mt-4 grid gap-6 bg-white p-6 shadow-card sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          <div>
            <h3 className="t-2">{area.area}</h3>
            <p className="t-body mt-2 max-w-[54ch] text-text-2">{area.lede}</p>
            <ol className="mt-6 space-y-5">
              {area.steps.map((s, i) => {
                const x = s.extra ? extraById(s.extra) : undefined;
                return (
                  <li key={s.t} className="flex gap-4">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-[12px] text-white">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-medium">{s.t}</span>
                        {(s.chip || x) && (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-medium", (s.chip ?? "").startsWith("included") ? "bg-pass-soft text-[#157a44]" : "bg-accent-soft text-accent-2")}>
                            {s.chip ?? (x!.price ? `add-on ${inr(x!.price)}` : "included")}
                          </span>
                        )}
                      </div>
                      <p className="t-small mt-1 text-[14px] leading-relaxed">{s.b}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="grid content-start gap-3">
            {area.shots.map((n, i) => (
              <BeforeAfter key={n} name={n} label={`${area.area} · ${shotLabel[n]}`} time={i === 0 ? ["11:14", "15:40"] : ["11:52", "15:44"]} compact className={i > 0 ? "max-sm:hidden" : undefined} />
            ))}
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-2">
              <Camera size={14} className="mt-[2px] shrink-0 text-accent" />
              Drag the handle. Every surface is shot from the same spot before the crew starts and after they finish, and both frames land in your report.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* the four things that only happen because an inspector is standing there */}
      <div className="swipe mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {finish.map((f) => (
          <div key={f.t} className="card h-full bg-beige p-5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-accent shadow-card"><Check size={15} strokeWidth={3} /></span>
            <div className="mt-3 text-[14.5px] font-medium">{f.t}</div>
            <p className="t-small mt-1 text-[13px] leading-relaxed">{f.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
