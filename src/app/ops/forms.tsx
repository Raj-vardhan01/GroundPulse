"use client";

import { useActionState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { opsLogin, type OpsState } from "@/lib/opsActions";
import { SubmitButton } from "@/components/app/SubmitButton";

export function OpsLogin() {
  const [state, submit] = useActionState(opsLogin, { ok: false } as OpsState);
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <form action={submit} className="card w-full max-w-[22rem] border border-line bg-white p-6 shadow-card">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-tint text-accent"><Lock size={18} /></span>
        <h1 className="serif mt-4 text-[26px] tracking-[-0.03em]">Ops</h1>
        <p className="t-small mt-1">StillYours staff only.</p>
        <input
          name="password" type="password" autoComplete="current-password" required autoFocus aria-label="Password" placeholder="Password"
          className="mt-5 h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[16px] outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
        />
        {state.error && (
          <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-fail-soft px-3 py-2 text-[13px] leading-snug text-[#b03434]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {state.error}
          </p>
        )}
        <SubmitButton className="mt-4 w-full" pendingLabel="Checking…">Open</SubmitButton>
      </form>
    </main>
  );
}

/** A form whose action answers back — the error or the "done" sits next
    to the button that caused it. */
export function ActionForm({
  action, children, submit, pending = "Saving…", className,
}: {
  action: (prev: OpsState, fd: FormData) => Promise<OpsState>;
  children: React.ReactNode;
  submit: string;
  pending?: string;
  className?: string;
}) {
  const [state, run] = useActionState(action, { ok: false } as OpsState);
  return (
    <form action={run} className={className}>
      {children}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <SubmitButton className="btn-sm" pendingLabel={pending}>{submit}</SubmitButton>
        {state.error && <span className="text-[12.5px] leading-snug text-[#b03434]">{state.error}</span>}
        {state.ok && state.message && <span className="text-[12.5px] leading-snug text-pass">{state.message}</span>}
      </div>
    </form>
  );
}

/** For what cannot be taken back — money marked sent, a visit cancelled. */
export function ConfirmForm({
  action, ask, children, className,
}: { action: (fd: FormData) => Promise<void>; ask: string; children: React.ReactNode; className?: string }) {
  return (
    <form action={action} className={className} onSubmit={(e) => { if (!window.confirm(ask)) e.preventDefault(); }}>
      {children}
    </form>
  );
}
