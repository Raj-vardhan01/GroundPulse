"use client";

import { useActionState, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { openTicket, type FormState } from "@/lib/actions";
import { TICKET_TOPICS } from "@/lib/tickets";
import { SubmitButton } from "@/components/app/SubmitButton";
import { cn } from "@/lib/cn";

/** "Something wrong?" — written here, answered by a person, and kept with
    the visit it is about. */
export function TicketForm({ visitId, cta = "Something wrong with this visit?", defaultOpen = false }: { visitId?: string; cta?: string; defaultOpen?: boolean }) {
  const [state, submit] = useActionState(openTicket, { ok: false } as FormState);
  const [open, setOpen] = useState(defaultOpen);
  const [topic, setTopic] = useState<string>(TICKET_TOPICS[0]);

  if (state.ok) return <p className="rounded-[12px] bg-pass-soft px-4 py-3 text-[13.5px] text-[#157a44]" role="status">{state.message}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="t-small flex w-full items-center justify-between rounded-[12px] bg-paper px-4 py-3 text-left transition hover:bg-beige">
        <span className="flex items-center gap-2"><MessageSquare size={14} /> {cta}</span><span className="font-medium text-accent">Tell us →</span>
      </button>
    );
  }
  return (
    <form action={submit} className="grid gap-3 rounded-[14px] border border-line-2 p-4">
      {visitId && <input type="hidden" name="visitId" value={visitId} />}
      <input type="hidden" name="topic" value={topic} />
      <div className="text-[14px] font-medium">What is it about?</div>
      <div className="flex flex-wrap gap-1.5">
        {TICKET_TOPICS.map((t) => (
          <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t}
            className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition", topic === t ? "border-accent bg-accent-tint text-accent-2" : "border-line-2 text-text-2")}>{t}</button>
        ))}
      </div>
      <textarea name="body" rows={3} required minLength={10} maxLength={2000} placeholder="Tell us what happened, in your own words."
        className="w-full rounded-[12px] border border-line-2 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed outline-none focus:border-accent" />
      {state.error && <p className="text-[13px] text-fail" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton className="btn-sm" pendingLabel="Sending…"><Send size={14} /> Send to a person</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-white btn-sm">Not now</button>
      </div>
      <p className="t-small">A person reads it and replies here, usually the same day.</p>
    </form>
  );
}
