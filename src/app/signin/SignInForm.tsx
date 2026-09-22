"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Phone } from "lucide-react";
import { confirmCode, requestCode, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { EASE } from "@/lib/motion";

const blank: FormState = { ok: false };

export function SignInForm() {
  const [sent, sendCode] = useActionState(requestCode, blank);
  const [checked, verify] = useActionState(confirmCode, blank);
  const [phone, setPhone] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  const stage: "phone" | "code" = sent.ok ? "code" : "phone";
  useEffect(() => { if (stage === "code") codeRef.current?.focus(); }, [stage]);

  return (
    <div className="w-full max-w-[400px]">
      <AnimatePresence mode="wait">
        {stage === "phone" ? (
          <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">Sign in.</h1>
            <p className="t-small mt-2.5">Your number is the account. We send a six-digit code — no password to forget at 2 AM in another timezone.</p>

            <form action={sendCode} className="mt-7">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">Mobile number</span>
                <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <Phone size={15} className="shrink-0 text-text-3" />
                  <span className="text-[15px] text-text-2">+91</span>
                  <input
                    name="phone" inputMode="numeric" autoComplete="tel" autoFocus required
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="90000 00000"
                    className="h-12 w-full bg-transparent text-[15px] tracking-[0.02em] outline-none placeholder:text-text-3"
                  />
                </div>
              </label>
              {sent.error && <p className="mt-2 text-[13px] text-fail">{sent.error}</p>}
              <Submit label="Send code" />
            </form>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">Check your phone.</h1>
            <p className="t-small mt-2.5">Six digits sent to <b className="text-ink">+91 {sent.phone?.slice(0, 5)} {sent.phone?.slice(5)}</b>.</p>

            {sent.devCode && (
              <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-gold/40 bg-gold-soft px-4 py-3">
                <Lock size={14} className="mt-0.5 shrink-0 text-gold-2" />
                <div className="text-[13px] leading-snug text-[#7a5209]">
                  No SMS gateway is configured, so here is the code: <b className="font-mono text-[15px] tracking-[0.1em]">{sent.devCode}</b>
                  <div className="mt-0.5 text-[11.5px] opacity-80">Set SMS_PROVIDER_KEY and this stops appearing.</div>
                </div>
              </div>
            )}

            <form action={verify} className="mt-6">
              <input type="hidden" name="phone" value={sent.phone ?? ""} />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">Six-digit code</span>
                <input
                  ref={codeRef} name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6}
                  placeholder="······"
                  className="h-14 w-full rounded-[12px] border border-line-2 bg-white px-4 text-center font-mono text-[24px] tracking-[0.5em] text-ink outline-none transition placeholder:tracking-[0.3em] placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </label>
              {checked.error && <p className="mt-2 text-[13px] text-fail">{checked.error}</p>}
              <Submit label="Sign in" />
            </form>

            <form action={sendCode} className="mt-3 text-center">
              <input type="hidden" name="phone" value={sent.phone ?? ""} />
              <button className="text-[13px] font-medium text-text-2 underline underline-offset-4 transition hover:text-ink">Send a new code</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Submit = ({ label }: { label: string }) => (
  <SubmitButton className="mt-4 w-full" icon={<ArrowRight size={16} />}>{label}</SubmitButton>
);
