"use client";

import { useActionState, useState } from "react";
import { CalendarClock, Check, Trash2, X } from "lucide-react";
import { cancelVisit, rescheduleVisit, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { DayPicker, firstBookable } from "@/components/app/DayPicker";

/* One object for "nothing has happened yet". A fresh literal on every
   render never equals the last one, and the check below would set state
   on every server render — forever. */
const IDLE: FormState = { ok: false };

/** Moving or cancelling, free until the day before — so the buttons say
    so rather than hiding behind a support number. On the day itself the
    server refuses, and so does this panel, with the reason. */
export function VisitActions({
  id, slot, blocked, cancelNote, tz,
}: {
  id: string;
  slot: string;
  /** why it cannot be changed from here right now, if it cannot */
  blocked: string | null;
  /** what cancelling will do to money or a plan, said before they press it */
  cancelNote: string;
  tz: string;
}) {
  const [moved, move] = useActionState(rescheduleVisit, IDLE);
  const [cancelled, cancel] = useActionState(cancelVisit, IDLE);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [date, setDate] = useState(() => firstBookable());
  const [pick, setPick] = useState(slot);
  /* Close the panel the moment a move lands — the page behind it has
     already re-rendered with the new day. */
  const [seen, setSeen] = useState<FormState>(IDLE);
  if (moved !== seen) {
    setSeen(moved);
    if (moved.ok) setOpen(false);
  }

  if (blocked) {
    return (
      <div className="border-t border-line p-4">
        <p className="t-small leading-snug">{blocked}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-line p-4">
      {!open && !confirming && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setOpen(true)} className="btn btn-white btn-sm"><CalendarClock size={14} /> Move this visit</button>
          <button onClick={() => setConfirming(true)} className="btn btn-ghost btn-sm text-text-2"><Trash2 size={14} /> Cancel</button>
          {moved.ok && moved.message && <span className="text-[13px] font-medium text-pass" role="status"><Check size={13} className="mr-1 inline" />{moved.message} We are finding an inspector for it.</span>}
        </div>
      )}

      {open && (
        <form action={move} className="grid gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="scheduledFor" value={date} />
          <input type="hidden" name="slot" value={pick} />
          <div className="t-label">Pick another day</div>
          <DayPicker compact date={date} onDate={setDate} slot={pick} onSlot={setPick} tz={tz} />
          {moved.error && <p className="text-[13px] text-fail" role="alert">{moved.error}</p>}
          <div className="flex gap-2">
            <SubmitButton className="btn-sm" pendingLabel="Moving…"><Check size={14} /> Confirm new day</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-white btn-sm"><X size={14} /> Keep as it is</button>
          </div>
        </form>
      )}

      {confirming && (
        <form action={cancel} className="rounded-[14px] bg-fail-soft p-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-[14px] font-medium text-[#b03434]">Cancel this visit?</p>
          <p className="mt-1 text-[13px] leading-snug text-[#b03434]/80">{cancelNote}</p>
          {cancelled.error && <p className="mt-2 text-[13px] font-medium text-[#b03434]" role="alert">{cancelled.error}</p>}
          <div className="mt-3 flex gap-2">
            <SubmitButton className="btn-sm bg-fail text-white [box-shadow:inset_0_-3px_0_0_rgba(0,0,0,.15)]" pendingLabel="Cancelling…"><Trash2 size={14} /> Yes, cancel it</SubmitButton>
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-white btn-sm">Keep it</button>
          </div>
        </form>
      )}
    </div>
  );
}
