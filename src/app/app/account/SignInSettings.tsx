"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Check, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { savePassword, sendVerification, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { DevLink } from "@/app/signin/AuthCard";

const box = "flex items-center gap-2.5 rounded-[12px] border border-line-2 bg-white px-3.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10";
const field = "h-11 w-full min-w-0 bg-transparent text-[14.5px] outline-none placeholder:text-text-3";

/* How this account gets in: Google, an email and a password, or both —
   and the one thing each needs to stay safe. */
export function SignInSettings({ email, verified, google, hasPassword }: { email: string; verified: boolean; google: boolean; hasPassword: boolean }) {
  return (
    <ul className="divide-y divide-line">
      <li className="flex items-center gap-4 px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper"><GoogleG /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-medium">Google</div>
          <div className="t-small mt-0.5">{google ? "Connected — Continue with Google signs you in." : `Not connected. Use Continue with Google once with ${email || "your email"} to connect it.`}</div>
        </div>
        {google && <span className="chip chip-pass shrink-0">On</span>}
      </li>

      <li className="grid gap-3 px-5 py-4">
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-text-2"><Mail size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-medium">Email</div>
            <div className="t-small mt-0.5 truncate">{email || "Not set"}</div>
          </div>
          {email && (verified ? <span className="chip chip-pass shrink-0">Confirmed</span> : <span className="chip chip-warn shrink-0">Not confirmed</span>)}
        </div>
        {email && !verified && <ResendLink />}
      </li>

      <li className="grid gap-3 px-5 py-4">
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-text-2"><KeyRound size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-medium">Password</div>
            <div className="t-small mt-0.5">{hasPassword ? "Sign in with your email and password." : "None yet — set one to sign in with your email as well."}</div>
          </div>
          {hasPassword && <span className="chip chip-pass shrink-0">Set</span>}
        </div>
        <PasswordForm hasPassword={hasPassword} />
      </li>
    </ul>
  );
}

function ResendLink() {
  const [state, act] = useActionState(sendVerification, { ok: false } as FormState);
  return (
    <form action={act} className="pl-14">
      {state.ok ? (
        <p className="t-small flex items-center gap-1.5 text-pass"><Check size={14} /> {state.message}</p>
      ) : (
        <SubmitButton className="btn-sm" pendingLabel="Sending…">Send a confirm link</SubmitButton>
      )}
      {state.error && <p className="mt-2 text-[13px] text-[#b03434]">{state.error}</p>}
      {state.devLink && <DevLink href={state.devLink} />}
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, act] = useActionState(savePassword, { ok: false } as FormState);
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  if (!open) {
    return (
      <div className="pl-14">
        {state.ok && <p className="t-small mb-2 flex items-center gap-1.5 text-pass"><Check size={14} /> {state.message}</p>}
        <button type="button" onClick={() => setOpen(true)} className="btn btn-white btn-sm">{hasPassword ? "Change password" : "Set a password"}</button>
      </div>
    );
  }

  return (
    <form action={act} className="grid gap-3 sm:pl-14">
      {hasPassword && (
        <div className={box}>
          <input name="current" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Current password" className={field} />
        </div>
      )}
      <div className={box}>
        <input name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="New password — at least 8 characters" className={field} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide passwords" : "Show passwords"} className="shrink-0 p-1 text-text-3 hover:text-ink">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className={box}>
        <input name="again" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="New password, once more" className={field} />
      </div>
      {state.error && (
        <p className="flex items-start gap-2 rounded-[12px] bg-fail-soft px-3.5 py-2.5 text-[13px] leading-snug text-[#b03434]" role="alert">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      {state.ok && <p className="t-small flex items-center gap-1.5 text-pass"><Check size={14} /> {state.message}</p>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton className="btn-sm" pendingLabel="Saving…">{hasPassword ? "Change password" : "Set password"}</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-white btn-sm">Cancel</button>
      </div>
      {hasPassword && <p className="t-small">Changing it signs you out on every other device.</p>}
    </form>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
