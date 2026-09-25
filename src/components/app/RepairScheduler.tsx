"use client";

import { useActionState, useState } from "react";
import { CalendarClock, Check } from "lucide-react";
import { scheduleRepair, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { DayPicker, firstBookable } from "@/components/app/DayPicker";

/* One object, made once. An inline `{ ok: false }` is a new object on every
   render, so on the server the "has the result changed?" check below never
   settles and the page dies with "Too many re-renders". */
const IDLE: FormState = { ok: false };

/** The owner says when the approved repair can happen; ops confirms the
    pro for that day and sends an inspector to be there. */
export function RepairScheduler({ id, current, tz }: { id: string; current: { date: string; slot: string } | null; tz: string }) {
  const [state, save] = useActionState(scheduleRepair, IDLE);
  const [open, setOpen] = useState(!current);
  const [date, setDate] = useState(() => current?.date || firstBookable());
  const [slot, setSlot] = useState(current?.slot || "10:00 – 13:00");
  const [seen, setSeen] = useState<FormState>(IDLE);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setOpen(false);
  }

  if (!open) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state.ok && <span className="text-[13px] font-medium text-pass" role="status"><Check size={13} className="mr-1 inline" />Day saved — we confirm the pro next.</span>}
        <button type="button" onClick={() => setOpen(true)} className="btn btn-white btn-sm"><CalendarClock size={14} /> {current ? "Change the day" : "Choose a day"}</button>
      </div>
    );
  }
  return (
    <form action={save} className="mt-3 grid gap-3 rounded-[14px] border border-accent/20 bg-accent-tint p-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="scheduledFor" value={date} />
      <input type="hidden" name="slot" value={slot} />
      <div className="text-[14px] font-semibold text-accent-2">When can the work happen?</div>
      <p className="t-small -mt-2">Your inspector is there the whole time. Pick any day from two days out.</p>
      <DayPicker compact date={date} onDate={setDate} slot={slot} onSlot={setSlot} tz={tz} />
      {state.error && <p className="text-[13px] text-fail" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton className="btn-sm" pendingLabel="Saving…"><Check size={14} /> Save this day</SubmitButton>
        {current && <button type="button" onClick={() => setOpen(false)} className="btn btn-white btn-sm">Keep it</button>}
      </div>
    </form>
  );
}
