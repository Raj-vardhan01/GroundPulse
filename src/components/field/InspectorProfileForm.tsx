"use client";

import { useActionState, useState } from "react";
import { ArrowRight, IndianRupee, User } from "lucide-react";
import { saveInspectorProfile, type FieldState } from "@/lib/fieldActions";
import { SubmitButton } from "@/components/app/SubmitButton";

const shell = "flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10";
const field = "h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text-3";

/* Name and UPI — the first screen a new inspector sees, and the place
   they change their UPI later. */
export function InspectorProfileForm({ name, upiId, cta = "Save" }: { name: string; upiId: string; cta?: string }) {
  const [state, act] = useActionState(saveInspectorProfile, { ok: false } as FieldState);
  /* Held here, so a rejected UPI does not also wipe the name. */
  const [n, setN] = useState(name);
  const [u, setU] = useState(upiId);
  return (
    <form action={act} className="grid gap-4 text-left">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-text-2">Your name, as owners see it</span>
        <div className={shell}><User size={15} className="shrink-0 text-text-3" /><input name="name" required value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g. Ravi K." className={field} /></div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-text-2">UPI ID — the day&apos;s pay goes here that evening</span>
        <div className={shell}><IndianRupee size={15} className="shrink-0 text-text-3" /><input name="upiId" required value={u} onChange={(e) => setU(e.target.value)} placeholder="yourname@okaxis" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={field} /></div>
      </label>
      {state.error && <p className="text-[13px] text-fail" role="alert">{state.error}</p>}
      {state.ok && <p className="text-[13px] text-pass">Saved.</p>}
      <SubmitButton className="w-full" icon={<ArrowRight size={16} />}>{cta}</SubmitButton>
    </form>
  );
}
