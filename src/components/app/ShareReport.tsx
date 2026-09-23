"use client";

import { useState } from "react";
import { Check, Copy, Link2, Link2Off, Printer } from "lucide-react";
import { shareReport } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

/* A report is often for more than one person — a brother in Pune, a
   parent in the same city. A private link, readable without an account,
   that the owner can switch off; and a clean printout for everybody else. */
export function ShareReport({ id, token }: { id: string; token: string | null }) {
  const [copied, setCopied] = useState(false);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/r/${token}` : token ? `/r/${token}` : "";

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* shown on screen anyway */ }
  };

  return (
    <div className="grid gap-3">
      {token ? (
        <>
          <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-3 py-2.5">
            <Link2 size={14} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12.5px]" suppressHydrationWarning>{url}</span>
            <button type="button" onClick={copy} className="btn btn-white btn-sm shrink-0">{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button>
          </div>
          <p className="t-small leading-snug">Anyone with this link can read the report — findings and photographs, not prices or your account. Switch it off and the link stops working at once.</p>
          <form action={shareReport}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="on" value="0" />
            <SubmitButton className="btn-white btn-sm" pendingLabel="Switching off…"><Link2Off size={14} /> Stop sharing</SubmitButton>
          </form>
        </>
      ) : (
        <form action={shareReport} className="grid gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="on" value="1" />
          <p className="t-small leading-snug">Make a private link for family — they can read it without an account, and you can switch it off any time.</p>
          <SubmitButton className="btn-white btn-sm justify-self-start" pendingLabel="Making the link…"><Link2 size={14} /> Make a share link</SubmitButton>
        </form>
      )}
      <button type="button" onClick={() => window.print()} className="btn btn-white btn-sm justify-self-start"><Printer size={14} /> Print or save as PDF</button>
    </div>
  );
}
