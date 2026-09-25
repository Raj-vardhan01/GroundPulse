"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import { resetPassword, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

export function ResetForm({ token }: { token: string }) {
  const [state, act] = useActionState(resetPassword, { ok: false } as FormState);
  const [show, setShow] = useState(false);
  const box = "flex items-center gap-2.5 rounded-[12px] border border-line-2 bg-white px-3.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10";
  const field = "h-12 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-text-3";
  return (
    <form action={act} className="mt-6 grid gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-medium">New password</span>
        <div className={box}>
          <Lock size={16} className="shrink-0 text-text-3" />
          <input name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} autoFocus placeholder="At least 8 characters" className={field} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide passwords" : "Show passwords"} className="shrink-0 p-1 text-text-3 transition hover:text-ink">
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-medium">Once more</span>
        <div className={box}>
          <Lock size={16} className="shrink-0 text-text-3" />
          <input name="again" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="The same again" className={field} />
        </div>
      </label>
      {state.error && (
        <p className="flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Saving…">Save and sign in</SubmitButton>
    </form>
  );
}
