"use client";

import { useActionState, useState } from "react";
import { KeyRound, Pencil, X } from "lucide-react";
import { updateProperty, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import type { Property } from "@/lib/types";

/* The one thing an owner actually edits after the fact: who holds a key
   and what an inspector needs to know at the gate. */
export function AccessNotes({ p }: { p: Property }) {
  const [state, submit] = useActionState(updateProperty, { ok: false } as FormState);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="px-5 py-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="t-label">Getting in</dt>
            <dd className="mt-1 text-[14.5px] leading-relaxed">{p.accessNote || <span className="text-text-3">Nothing noted — worth adding before the next visit.</span>}</dd>
          </div>
          <div>
            <dt className="t-label">Key holder</dt>
            <dd className="mt-1 flex items-center gap-2 text-[14.5px]"><KeyRound size={14} className="text-text-3" />{p.keyHolderName || <span className="text-text-3">Nobody listed</span>}</dd>
          </div>
          <div>
            <dt className="t-label">Their number</dt>
            <dd className="mt-1 text-[14.5px] tabular-nums">{p.keyHolderPhone || <span className="text-text-3">—</span>}</dd>
          </div>
        </dl>
        <button onClick={() => setEditing(true)} className="btn btn-pill btn-sm mt-4"><Pencil size={13} /> Edit details</button>
        {state.ok && <span className="ml-3 text-[13px] text-pass">Saved.</span>}
      </div>
    );
  }

  return (
    <form action={submit} className="grid gap-4 px-5 py-4" onSubmit={() => setTimeout(() => setEditing(false), 400)}>
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="label" value={p.label} />
      <input type="hidden" name="address" value={p.address} />
      <input type="hidden" name="locality" value={p.locality} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-text-2">Anything the inspector should know</span>
        <textarea name="accessNote" rows={3} defaultValue={p.accessNote} className="w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-text-2">Key holder</span>
          <input name="keyHolderName" defaultValue={p.keyHolderName} className="h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-text-2">Their number</span>
          <input name="keyHolderPhone" defaultValue={p.keyHolderPhone} inputMode="tel" className="h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" />
        </label>
      </div>
      <div className="flex gap-2">
        <SubmitButton className="btn-sm" pendingLabel="Saving…">Save</SubmitButton>
        <button type="button" onClick={() => setEditing(false)} className="btn btn-white btn-sm"><X size={14} /> Cancel</button>
      </div>
    </form>
  );
}
