"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { SLOTS } from "@/lib/quote";
import { bookableDays, slotInZone } from "@/lib/format";
import { cn } from "@/lib/cn";

/* The one day-and-window picker: booking, moving a visit and choosing a
   repair day all offer exactly the days the server will accept.

   The days are worked out when the component mounts, on Bengaluru's
   calendar — not once when the module first loaded (a phone that kept
   the app open overnight was offering yesterday's dates) and not in the
   server's timezone (which is why the server and the browser used to
   disagree about the list between midnight and 05:30 IST). */
export function DayPicker({
  date, onDate, slot, onSlot, tz, compact = false,
}: {
  date: string;
  onDate: (key: string) => void;
  slot: string;
  onSlot: (slot: string) => void;
  /** the owner's zone, to show the window on their own clock too */
  tz?: string;
  compact?: boolean;
}) {
  const days = useMemo(() => bookableDays(), []);
  const local = slotInZone(date, slot, tz);

  return (
    <div>
      <div className="hscroll -mx-1 gap-2 px-1 pb-1">
        {days.map((d) => {
          const on = date === d.key;
          return (
            <button key={d.key} type="button" onClick={() => onDate(d.key)} aria-pressed={on}
              className={cn("grid shrink-0 place-items-center rounded-[14px] border transition", compact ? "w-[56px] py-2" : "w-[62px] py-2.5",
                on ? "border-accent bg-accent text-white" : "border-line-2 hover:bg-paper")}>
              <span className={cn("text-[10.5px] font-semibold uppercase tracking-[0.06em]", on ? "text-white/60" : "text-text-3")}>{d.first ? d.month : d.dow}</span>
              <span className={cn("mt-0.5 font-medium tabular-nums leading-none", compact ? "text-[17px]" : "text-[19px]")}>{d.date}</span>
              <span className={cn("mt-1 text-[10px]", on ? "text-white/60" : "text-text-3")}>{d.month}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SLOTS.map((s) => (
          <button key={s} type="button" onClick={() => onSlot(s)} aria-pressed={slot === s}
            className={cn("flex h-11 items-center justify-center gap-1.5 rounded-[12px] border text-[13px] font-medium tabular-nums transition",
              slot === s ? "border-accent bg-accent-tint text-accent-2" : "border-line-2 text-text-2 hover:bg-paper")}>
            <Clock size={13} /> {s}
          </button>
        ))}
      </div>
      <p className="t-small mt-2">
        Times are Bengaluru time (IST){local ? <> — that is <b className="text-ink">{local}</b> where you are.</> : "."}
      </p>
    </div>
  );
}

/** The first day that can be booked — what a picker should start on. */
export const firstBookable = (offset = 2) => bookableDays()[offset]?.key ?? bookableDays()[0].key;
