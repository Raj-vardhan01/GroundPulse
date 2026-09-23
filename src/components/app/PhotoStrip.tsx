"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Photo } from "@/lib/types";

/* The inspector's own photographs, small in the list and full-screen on
   a tap — with where and when each one was taken, because that stamp is
   the whole point of them. */
export function PhotoStrip({ photos, label, size = 56, className }: { photos: Photo[]; label: string; size?: number; className?: string }) {
  const [open, setOpen] = useState<Photo | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(p)} aria-label={`Open photo ${i + 1} of ${label}`}
            className="overflow-hidden rounded-[8px] ring-1 ring-line transition hover:ring-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt={`${label}, photo ${i + 1}`} style={{ width: size, height: size }} className="object-cover" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={() => setOpen(null)} role="dialog" aria-label={label}>
            <div className="w-full max-w-[640px]" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={open.thumb} alt={label} className="max-h-[70vh] w-full rounded-[14px] object-contain" />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/75">
                <span className="font-medium text-white">{label}</span>
                <span>{fmtDateTime(open.at)} IST</span>
                {open.lat !== null && open.lng !== null
                  ? <span className="flex items-center gap-1"><MapPin size={12} /> {open.lat.toFixed(4)}°, {open.lng.toFixed(4)}°</span>
                  : <span className="flex items-center gap-1 text-white/50"><MapPin size={12} /> No location — the phone could not get one</span>}
                <button type="button" onClick={() => setOpen(null)} className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-white"><X size={14} /> Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
