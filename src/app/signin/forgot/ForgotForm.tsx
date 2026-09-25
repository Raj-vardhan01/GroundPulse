"use client";

import { useActionState } from "react";
import { AlertTriangle, MailCheck, Mail } from "lucide-react";
import { forgotPassword, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { DevLink } from "../AuthCard";

export function ForgotForm() {
  const [state, act] = useActionState(forgotPassword, { ok: false } as FormState);

  if (state.ok) {
    return (
      <div className="mt-6">
        <p className="flex items-start gap-2.5 rounded-[12px] bg-pass-soft px-4 py-3.5 text-[14px] leading-snug text-ink">
          <MailCheck size={17} className="mt-0.5 shrink-0 text-pass" /> {state.message}
        </p>
        <p className="t-small mt-3">Nothing in a few minutes? Check your spam folder, or ask again.</p>
        {state.devLink && <DevLink href={state.devLink} />}
      </div>
    );
  }

  return (
    <form action={act} className="mt-6 grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-medium">Email</span>
        <div className="flex items-center gap-2.5 rounded-[12px] border border-line-2 bg-white px-3.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
          <Mail size={16} className="shrink-0 text-text-3" />
          <input name="email" type="email" autoComplete="email" required autoFocus placeholder="you@example.com" className="h-12 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-text-3" />
        </div>
      </label>
      {state.error && (
        <p className="flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Sending…">Send me a link</SubmitButton>
    </form>
  );
}
