"use client";

import { useActionState, useSyncExternalStore } from "react";
import { ArrowRight, Globe2, Mail, Phone, User } from "lucide-react";
import { saveProfile, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { prettyPhone } from "@/lib/phone";

const shell = "flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10";
const field = "h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text-3";

const noSubscribe = () => () => {};
const browserTz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ""; /* keep IST */ }
};

export function ProfileForm({ phone, name, email, livesIn, compact = false }: { phone: string; name: string; email: string; livesIn: string; compact?: boolean }) {
  const [state, submit] = useActionState(saveProfile, { ok: false } as FormState);
  /* The browser knows which clock the owner lives on. That is what lets
     every visit window show "10:00 IST — 08:30 where you are". */
  const tz = useSyncExternalStore(noSubscribe, browserTz, () => "");

  return (
    <form action={submit} className="grid gap-4">
      {!compact && <input type="hidden" name="step" value="welcome" />}
      <input type="hidden" name="tz" value={tz} />

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-text-2">Your name</span>
        <div className={shell}><User size={15} className="shrink-0 text-text-3" /><input name="name" required defaultValue={name} placeholder="Priya Sharma" className={field} /></div>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-text-2">Email — where reports land</span>
          <div className={shell}><Mail size={15} className="shrink-0 text-text-3" /><input name="email" type="email" defaultValue={email} placeholder="you@example.com" className={field} /></div>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between"><span className="text-[13px] font-medium text-text-2">Where you live</span><span className="text-[12px] text-text-3">{tz ? `your clock: ${tz.replace(/_/g, " ")}` : "so we time things for you"}</span></span>
          <div className={shell}><Globe2 size={15} className="shrink-0 text-text-3" /><input name="livesIn" defaultValue={livesIn} placeholder="Dubai, UAE" className={field} /></div>
        </label>
      </div>

      <div className="flex items-center gap-2 rounded-[12px] bg-beige px-4 py-3 text-[13px] text-text-2">
        <Phone size={14} className="shrink-0" /> Signed in as {prettyPhone(phone)} — this is your account.
      </div>

      {state.error && <p className="rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] text-[#b03434]" role="alert">{state.error}</p>}
      {state.ok && compact && <p className="rounded-[12px] bg-pass-soft px-4 py-3 text-[13.5px] text-[#157a44]" role="status">Saved.</p>}

      <SubmitButton className={compact ? "w-full sm:w-auto sm:justify-self-start sm:px-8" : "w-full"} icon={compact ? undefined : <ArrowRight size={16} />} pendingLabel="Saving…">
        {compact ? "Save changes" : "Continue"}
      </SubmitButton>
    </form>
  );
}
