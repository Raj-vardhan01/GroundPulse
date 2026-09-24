"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, input } from "./AccessForm";

/**
 * Inspector waitlist.
 *
 * The long application — documents, references, availability grid, the
 * declarations — belongs at the in-person interview, not in front of someone
 * who has just heard of us. We take enough to call them back, and say plainly
 * what applying leads to so that anyone unwilling stops here.
 */

const whatItMeans = [
  "We meet you in person in Bengaluru and check your original Aadhaar, PAN and address proof.",
  "Police verification is filed, and two references are actually called.",
  "You wear a body camera on every visit, and your first two visits are done beside one of the founders.",
];

export function InspectorForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function submitApplication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError(null);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) ?? "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "inspector",
          name: g("name"),
          phone: g("phone"),
          email: g("email"),
          city: g("city"),
          localities: g("localities"),
          occupation: g("occupation"),
          company: g("company"),
          source: typeof window === "undefined" ? "" : window.location.search,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "We could not save that just now.");
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "We could not save that just now.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-[16px] bg-accent-tint p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-white"><Check size={22} strokeWidth={3} /></span>
        <h2 className="t-3 mt-4 text-[22px] font-medium">Thank you — we have your details.</h2>
        <p className="t-body mx-auto mt-2 max-w-[42ch] text-[15px]">
          We are not taking on inspectors yet — the two of us are doing the first visits ourselves. When we start, you are on the
          list and we will call you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitApplication} className="mt-8 grid gap-5">
      <p className="rounded-[12px] bg-beige px-4 py-3 text-[14px] leading-relaxed text-text-2">
        We are not hiring yet — we are doing our first inspections ourselves. Leave your details and we will call you when we start.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name">
          <input name="name" required autoComplete="name" className={input} placeholder="Full name" />
        </Field>
        <Field label="WhatsApp number">
          <input name="phone" type="tel" required autoComplete="tel" className={input} placeholder="+91 …" />
        </Field>
      </div>

      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City">
          <input name="city" required defaultValue="Bengaluru" className={input} />
        </Field>
        <Field label="Areas you can reach easily" hint="Two or three localities.">
          <input name="localities" className={input} placeholder="Whitefield, Marathahalli…" />
        </Field>
      </div>

      <Field label="What do you do now?" hint="Optional — a line is enough.">
        <input name="occupation" className={input} placeholder="Facility supervisor, electrician, student…" />
      </Field>

      {/* A real person never sees or fills this. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="rounded-[12px] border border-line-2 p-4">
        <div className="text-[14px] font-medium">What applying leads to</div>
        <ul className="mt-2.5 grid gap-2">
          {whatItMeans.map((t) => (
            <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-text-2">
              <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
              {t}
            </li>
          ))}
        </ul>
        <Link href="/network" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent underline underline-offset-4">
          How we verify every inspector <ArrowRight size={14} />
        </Link>
      </div>

      <button type="submit" disabled={sending} className="btn btn-accent w-full disabled:opacity-60">
        {sending ? "Sending…" : <>Join the list <ArrowRight size={16} /></>}
      </button>

      {sendError && (
        <p className={cn("rounded-[12px] px-4 py-3 text-[14px]", "bg-fail-soft text-fail")}>
          {sendError} Please write to us at{" "}
          <a className="underline" href="mailto:stillyours.care@gmail.com">stillyours.care@gmail.com</a> and we&apos;ll sort it out.
        </p>
      )}
    </form>
  );
}
