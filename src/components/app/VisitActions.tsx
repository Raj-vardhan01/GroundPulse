"use client";

import { useActionState, useState } from "react";
import { CalendarClock, Check, Trash2, X } from "lucide-react";
import { cancelVisit, rescheduleVisit, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SLOTS } from "@/lib/quote";
import { cn } from "@/lib/cn";

const days = Array.from({ length: 28 }, (_, i) => new Date(Date.now() + (i + 2) * 86_400_000));
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Moving a visit is free until the day before — so the button says so
    rather than hiding behind a support number. */
export function VisitActions({ id, slot }: { id: string; slot: string }) {
  const [state, submit] = useActionState(rescheduleVisit, { ok: false } as FormState);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [date, setDate] = useState(iso(days[2]));
  const [pick, setPick] = useState(slot);

  return (
    <div className="border-t border-line p-4">
      {!open && !confirming && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setOpen(true)} className="btn btn-white btn-sm"><CalendarClock size={14} /> Move this visit</button>
          <button onClick={() => setConfirming(true)} className="btn btn-ghost btn-sm text-text-2"><Trash2 size={14} /> Cancel</button>
          {state.ok && <span className="self-center text-[13px] text-pass">Moved — we are finding an inspector for the new day.</span>}
        </div>
      )}

      {open && (
        <form action={submit} className="grid gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="scheduledFor" value={date} />
          <input type="hidden" name="slot" value={pick} />
          <div className="t-label">Pick another day</div>
          <div className="hscroll -mx-1 px-1 pb-1">
            {days.map((d) => {
              const k = iso(d);
              return (
                <button key={k} type="button" onClick={() => setDate(k)}
                  className={cn("grid w-[58px] shrink-0 place-items-center rounded-[12px] border py-2 transition", date === k ? "border-accent bg-accent text-white" : "border-line-2 hover:bg-paper")}>
                  <span className="text-[17px] font-medium tabular-nums leading-none">{d.getDate()}</span>
                  <span className={cn("mt-1 text-[10px]", date === k ? "text-white/60" : "text-text-3")}>{MONTHS[d.getMonth()]}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SLOTS.map((s) => (
              <button key={s} type="button" onClick={() => setPick(s)}
                className={cn("h-10 rounded-[10px] border text-[12.5px] font-medium tabular-nums transition", pick === s ? "border-accent bg-accent-tint text-accent-2" : "border-line-2 text-text-2")}>{s}</button>
            ))}
          </div>
          {state.error && <p className="text-[13px] text-fail">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton className="btn-sm" pendingLabel="Moving…"><Check size={14} /> Confirm new day</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-white btn-sm"><X size={14} /> Keep as it is</button>
          </div>
        </form>
      )}

      {confirming && (
        <form action={cancelVisit} className="rounded-[14px] bg-fail-soft p-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-[14px] font-medium text-[#b03434]">Cancel this visit?</p>
          <p className="mt-1 text-[13px] leading-snug text-[#b03434]/80">Nothing is charged. You can book another day whenever you like.</p>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-sm bg-fail text-white [box-shadow:inset_0_-3px_0_0_rgba(0,0,0,.15)]"><Trash2 size={14} /> Yes, cancel it</button>
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-white btn-sm">Keep it</button>
          </div>
        </form>
      )}
    </div>
  );
}
