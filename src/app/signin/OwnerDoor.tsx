"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, FlaskConical, Lock, Mail } from "lucide-react";
import { devSignIn, passwordSignIn, passwordSignUp, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

const ERRORS: Record<string, string> = {
  "google-off": "Google sign-in is not switched on yet. Use your email and password, or try again soon.",
  "google-cancelled": "Google sign-in was cancelled. Try again whenever you are ready.",
  "google-expired": "That sign-in took too long or was opened in another browser. Please try again.",
  "google-failed": "Google did not confirm who you are. Please try again.",
};

type Mode = "signin" | "signup";

/* Two ways in, the way any good app does it: Google in one tap, or an
   email and a password. Either way we ask for a phone number next, so the
   inspector can call from the door. */
export function OwnerDoor({ googleOn, dev, error, mode: first = "signin" }: { googleOn: boolean; dev: boolean; error?: string; mode?: Mode }) {
  const [mode, setMode] = useState<Mode>(first);
  const signin = mode === "signin";
  return (
    <div className="w-full">
      <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">{signin ? "Welcome back." : "Create your account."}</h1>
      <p className="t-small mt-2.5">
        {signin
          ? "Sign in with Google, or with your email and password."
          : "Use Google in one tap, or an email and a password. We ask for your phone number next, so the inspector can call you from the door."}
      </p>

      {error && ERRORS[error] && <p className="mt-5 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] text-[#b03434]" role="alert">{ERRORS[error]}</p>}

      {googleOn ? (
        <a href="/api/auth/google/start" className="mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-full border border-line-2 bg-white px-5 py-3.5 text-[15px] font-semibold text-ink shadow-card transition hover:border-ink/30 active:translate-y-px">
          <GoogleG /> Continue with Google
        </a>
      ) : (
        <p className="mt-7 rounded-[12px] border border-line-2 bg-white px-4 py-3.5 text-[13.5px] text-text-2">Google sign-in is being switched on — use your email for now.</p>
      )}

      <div className="my-6 flex items-center gap-3 text-[12.5px] font-medium uppercase tracking-[0.12em] text-text-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line-2" /> or <span className="h-px flex-1 bg-line-2" />
      </div>

      <EmailForm key={mode} mode={mode} />

      <p className="t-small mt-6 text-center">
        {signin ? "New to StillYours? " : "Already have an account? "}
        <button type="button" onClick={() => setMode(signin ? "signup" : "signin")} className="font-semibold text-accent underline-offset-4 hover:underline">
          {signin ? "Create an account" : "Sign in"}
        </button>
      </p>

      {dev && <DevSignIn />}
    </div>
  );
}

const shell = "flex items-center gap-2.5 rounded-[12px] border border-line-2 bg-white px-3.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10";
const field = "h-12 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-text-3";

function EmailForm({ mode }: { mode: Mode }) {
  const signin = mode === "signin";
  const [state, act] = useActionState(signin ? passwordSignIn : passwordSignUp, { ok: false } as FormState);
  const [show, setShow] = useState(false);
  return (
    <form action={act} className="grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-medium">Email</span>
        <div className={shell}>
          <Mail size={16} className="shrink-0 text-text-3" />
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={field} />
        </div>
      </label>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="text-[13.5px] font-medium">Password</label>
          {signin && <Link href="/signin/forgot" className="text-[13px] font-medium text-accent underline-offset-4 hover:underline">Forgot password?</Link>}
        </div>
        <div className={shell}>
          <Lock size={16} className="shrink-0 text-text-3" />
          <input
            id="password" name="password" type={show ? "text" : "password"} required
            autoComplete={signin ? "current-password" : "new-password"} minLength={signin ? undefined : 8}
            placeholder={signin ? "Your password" : "At least 8 characters"} className={field}
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="shrink-0 p-1 text-text-3 transition hover:text-ink">
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}

      <SubmitButton className="mt-1 w-full" pendingLabel={signin ? "Signing in…" : "Creating your account…"}>
        {signin ? "Sign in" : "Create account"}
      </SubmitButton>

      {!signin && (
        <p className="t-small text-center leading-snug">
          By creating an account you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      )}
    </form>
  );
}

function DevSignIn() {
  const [state, act] = useActionState(devSignIn, { ok: false } as FormState);
  return (
    <form action={act} className="mt-6 rounded-[14px] border border-gold/40 bg-gold-soft p-4">
      <p className="flex items-start gap-2 text-[12.5px] leading-snug text-[#7a5209]">
        <FlaskConical size={14} className="mt-0.5 shrink-0" /> Development only — sign in as any owner by email, no password. Production never shows this.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-3.5">
        <Mail size={15} className="shrink-0 text-text-3" />
        <input name="email" type="email" required placeholder="priya@example.in" className="h-11 w-full bg-transparent text-[14.5px] outline-none placeholder:text-text-3" />
      </div>
      {state.error && <p className="mt-2 text-[13px] text-fail" role="alert">{state.error}</p>}
      <SubmitButton className="btn-sm mt-3 w-full" pendingLabel="Signing in…">Sign in (dev)</SubmitButton>
    </form>
  );
}

/** Google's "G", in its own colours. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
