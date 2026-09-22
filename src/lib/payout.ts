/* ════════════════════════════════════════════════════════════════
   What an inspector earns for a job.

   Paid for the work, not as a cut of the price — a Care visit costs
   the owner nothing on the day, and the person walking it is owed
   the same either way. Rates are per visit, shown on the job board
   before anyone claims anything.
   ════════════════════════════════════════════════════════════════ */

import type { Property, VisitKind } from "@/lib/types";
import { blocksFor } from "@/lib/checklist";

export const RATES = {
  base: 450,          // turning up, the entry checks and the exit walkthrough
  perRoom: 60,        // every room block on the checklist
  plot: 500,          // a boundary walk is its own job
  cleaningSupervision: 600, // staying with the crew for the whole clean
  perCar: 100,
  camera: 100,        // wearing and handing over the body-cam footage
} as const;

export function payoutFor(p: Property, kind: VisitKind, addOns: Record<string, number> = {}) {
  let n = kind === "plot" ? RATES.plot : RATES.base + blocksFor(p).length * RATES.perRoom;
  if (kind === "cleaning") n += RATES.cleaningSupervision;
  if (addOns.cleaning || addOns.deep) n += RATES.cleaningSupervision;
  if (addOns.car) n += RATES.perCar * addOns.car;
  if (addOns.camera) n += RATES.camera;
  return Math.round(n / 10) * 10;
}

/** A four-digit code the owner reads out at the door. Deliberately not
    six: it is spoken over a bad line, not typed from an SMS. */
export const newOtp = () => String(Math.floor(1000 + Math.random() * 9000));
