"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BadgeCheck, Check, FileCheck2, KeyRound, Lock, Smartphone, UserCheck, Video, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

const input = "h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10";
const Field = ({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) => (
  <label className={cn("block", className)}>
    <span className="mb-1.5 block text-[13px] font-medium text-text-2">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[12px] text-text-3">{hint}</span>}
  </label>
);
const Step = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="card bg-white p-6 shadow-card sm:p-7">
    <div className="flex items-baseline gap-2.5">
      <span className="font-mono text-[12.5px] text-text-3">{n}</span>
      <h2 className="text-[18px] font-medium">{title}</h2>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

/* Documents — the required set is what blocks a first visit. */
const documents = [
  { t: "Aadhaar card", req: true, b: "Original seen in person, not a photo of a photo." },
  { t: "PAN card", req: true, b: "For payouts and TDS." },
  { t: "Permanent address proof", req: true, b: "Utility bill, rent agreement or passport." },
  { t: "Police verification certificate", req: true, b: "Have one, or be willing to apply — we file it with you." },
  { t: "Recent passport photograph", req: true, b: "This is the face the owner sees before the visit." },
  { t: "Bank account or UPI", req: true, b: "In your own name. We never pay to a third party." },
  { t: "Two contactable references", req: true, b: "We actually call both. Not family." },
  { t: "Driving licence", req: false, b: "If you'll travel by two-wheeler or car." },
  { t: "Vehicle registration (RC)", req: false, b: "For the vehicle you'll use on visits." },
  { t: "Experience letter / employer reference", req: false, b: "Facility, security, maintenance or field-ops work helps." },
  { t: "Educational certificate", req: false, b: "Optional. We care more about diligence than degrees." },
];

/* Declarations — every one must be ticked to submit. */
const declarations = [
  { I: UserCheck, t: "I consent to a police verification and a background check", b: "Including a criminal-record check, run before my first solo visit and repeated annually." },
  { I: AlertTriangle, t: "I have no criminal conviction and no pending case against me", b: "A false declaration here ends the engagement immediately, whenever it comes to light." },
  { I: Lock, t: "I will never enter a property without the owner's OTP", b: "No OTP, no checklist. The app will not open the visit without it." },
  { I: Lock, t: "I will never open cupboards, lockers, drawers or personal belongings", b: "Not even to check for damp. I photograph the outside and flag it instead." },
  { I: FileCheck2, t: "I accept that every visit is video-recorded, GPS-tagged and time-stamped", b: "The footage belongs to the owner and to Still Yours, and is admissible against me if I act badly." },
  { I: Wallet, t: "I agree to a deposit, held back from my fees", b: "Half of what each job pays until ₹5,000 is in — no cash upfront. A job I hand back inside 24 hours costs ₹150 of it, and a visit I miss costs ₹250. The rest stays my money and comes back when I leave in good standing and return the camera in working order." },
  { I: Video, t: "I will wear the body camera on every visit", b: "It is Still Yours property, handed over against a signed receipt with its serial number. Footage is uploaded after each visit and wiped from the device — I keep no copy. If I lose or damage it, its replacement cost of ₹9,000 comes out of my fees." },
  { I: KeyRound, t: "I will never open locked storage or keep an owner's keys", b: "No cupboards, wardrobes, lockers, safes or drawers. No cash accepted at a property. Keys go back to the caretaker or society the same day." },
  { I: FileCheck2, t: "I will sign an NDA and the Still Yours code of conduct", b: "Owner addresses, photographs and personal details never leave the platform." },
  { I: BadgeCheck, t: "I understand ratings below the bar end the engagement", b: "Owners rate every visit. Sustained low ratings, or one serious breach, and I leave the network." },
];

/* The gauntlet. This section is written as much for owners reading it as for applicants. */
const shortlistSteps = [
  { t: "Phone screen", b: "A short call to understand your background, your localities and why you want this." },
  { t: "In-person interview, originals in hand", b: "You come to us in Bengaluru. We check the original Aadhaar, PAN and address proof against the copies you sent. No remote onboarding, ever." },
  { t: "Police verification filed", b: "We submit it with you and wait for it to come back. Nobody visits a home on a pending verification." },
  { t: "Both references called", b: "We call them ourselves and ask specific questions. A reference who won't pick up is a failed reference." },
  { t: "Camera handover and deposit", b: "You sign for the body camera and its serial number. Half of each job's pay is held until your ₹5,000 deposit is in — you hold two jobs at a time until the first ₹1,500 of it is, then five — and it comes back when you leave and hand the camera back." },
  { t: "Your first two visits are with a founder", b: "One of us is beside you in the property, both times. Your checklist and video are reviewed line by line afterwards." },
  { t: "Probation — first five visits reviewed", b: "Every report you file in your first five visits is read by a human before it reaches the owner." },
  { t: "Solo visits, rated every time", b: "Only now do you get assigned on your own. And every owner rates you afterwards." },
];

const languages = ["Hindi", "English", "Kannada", "Tamil", "Telugu", "Marathi", "Malayalam", "Bengali"];
const availability = ["Weekday mornings", "Weekday afternoons", "Weekday evenings", "Saturdays", "Sundays"];

export function InspectorForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(documents.filter((d) => d.req).map((d) => [d.t, false])),
  );
  const [decl, setDecl] = useState<Record<number, boolean>>({});
  const allDeclared = declarations.every((_, i) => decl[i]);
  const requiredDocs = documents.filter((d) => d.req);
  const docsReady = requiredDocs.filter((d) => docs[d.t]).length;


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
          name: g("name"), dob: g("dob"), phone: g("phone"), email: g("email"),
          city: g("city"), localities: g("localities"), occupation: g("occupation"),
          experience: g("experience"), smartphone: g("smartphone"),
          mobileData: g("mobileData"), travel: g("travel"), distance: g("distance"),
          visitsPerWeek: g("visitsPerWeek"), commitment: g("commitment"),
          company: g("company"),
          documents: docs,
          declarations: decl,
          availability: {
            slots: fd.getAll("availability"),
            languages: fd.getAll("languages"),
          },
          refName: [g("refName1"), g("refName2")].filter(Boolean).join(" \u00b7 "),
          refPhone: [g("refPhone1"), g("refPhone2")].filter(Boolean).join(" \u00b7 "),
          refRelation: [g("refRelation1"), g("refRelation2")].filter(Boolean).join(" \u00b7 "),
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="card mx-auto max-w-[640px] bg-white p-10 text-center shadow-card">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pass text-white"><Check size={28} strokeWidth={3} /></span>
        <h2 className="t-2 mt-6">Application received.</h2>
        <p className="t-body mx-auto mt-3 max-w-[46ch] text-text-2">
          We read every one of these ourselves. If there's a fit for your localities you'll get a call for the phone screen — usually within a week. If we're not opening your area yet, we'll say so rather than leave you waiting.
        </p>
        <Link href="/" className="btn btn-white mt-8">Back to home</Link>
      </motion.div>
    );
  }

  return (
    <motion.form
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      onSubmit={submitApplication}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start"
    >
      <div className="grid grid-cols-1 gap-6">
        <Step n="01" title="About you">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name (as on Aadhaar)"><input name="name" required className={input} placeholder="Ravi Kumar" /></Field>
            <Field label="Date of birth"><input name="dob" required type="date" className={input} /></Field>
            <Field label="Phone / WhatsApp"><input name="phone" required className={input} placeholder="+91 98xxx xxxxx" /></Field>
            <Field label="Email"><input name="email" required type="email" className={input} placeholder="ravi@example.com" /></Field>
            <Field label="City"><input name="city" required className={input} placeholder="Bengaluru" /></Field>
            <Field label="Localities you can cover" hint="Be realistic — you'll be assigned inside this radius."><input name="localities" required className={input} placeholder="Whitefield, Marathahalli, Brookefield" /></Field>
            <Field label="Current or last occupation"><input name="occupation" required className={input} placeholder="Facility supervisor, Prestige Group" /></Field>
            <Field label="Years of work experience"><select name="experience" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Under 2 years", "2–5 years", "5–10 years", "10+ years"].map((o) => <option key={o}>{o}</option>)}</select></Field>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-[13px] font-medium text-text-2">Languages you speak</legend>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <label key={l} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-2 px-3.5 py-2 text-[13.5px] transition has-[:checked]:border-accent has-[:checked]:bg-accent-tint">
                  <input type="checkbox" name="languages" value={l} className="h-3.5 w-3.5 accent-[var(--accent)]" /> {l}
                </label>
              ))}
            </div>
          </fieldset>
        </Step>

        <Step n="02" title="Documents you can provide">
          <p className="t-small -mt-2 mb-4">
            Tick what you can produce. The seven marked <span className="font-medium text-accent-2">required</span> are checked as
            originals, in person, before your first visit — {docsReady} of {requiredDocs.length} ticked.
          </p>
          <div className="grid gap-2">
            {documents.map((d) => (
              <label key={d.t} className={cn("flex cursor-pointer items-start gap-3 rounded-[12px] border p-3.5 transition", docs[d.t] ? "border-accent bg-accent-tint" : "border-line-2 hover:border-ink/30")}>
                <input
                  type="checkbox"
                  required={d.req}
                  checked={!!docs[d.t]}
                  onChange={(e) => setDocs((s) => ({ ...s, [d.t]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium">
                    {d.t}
                    {d.req ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-accent-2">Required</span>
                           : <span className="rounded-full bg-beige px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-text-3">Helpful</span>}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-text-2">{d.b}</span>
                </span>
              </label>
            ))}
          </div>
        </Step>

        <Step n="03" title="Equipment & availability">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Smartphone"><select name="smartphone" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Android 11 or newer", "Android 10 or older", "iPhone", "I'd need to arrange one"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Mobile data" hint="Videos upload from the property."><select name="mobileData" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Unlimited 4G/5G plan", "Limited data plan", "Wi-Fi only"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="How you'll travel"><select name="travel" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Own two-wheeler", "Own car", "Public transport", "Cab / auto"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Distance you'll travel for a visit"><select name="distance" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Up to 5 km", "Up to 10 km", "Up to 20 km", "Anywhere in the city"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Visits you can take a week"><select name="visitsPerWeek" required className={input} defaultValue=""><option value="" disabled>Select</option>{["1–3", "4–7", "8–14", "15+"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Is this full-time or alongside a job?"><select name="commitment" required className={input} defaultValue=""><option value="" disabled>Select</option>{["Full-time", "Part-time alongside a job", "Weekends only"].map((o) => <option key={o}>{o}</option>)}</select></Field>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-[13px] font-medium text-text-2">When you're available</legend>
            <div className="flex flex-wrap gap-2">
              {availability.map((a) => (
                <label key={a} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-2 px-3.5 py-2 text-[13.5px] transition has-[:checked]:border-accent has-[:checked]:bg-accent-tint">
                  <input type="checkbox" name="availability" value={a} className="h-3.5 w-3.5 accent-[var(--accent)]" /> {a}
                </label>
              ))}
            </div>
          </fieldset>
        </Step>

        <Step n="04" title="Two references we can call">
          <p className="t-small -mt-2 mb-4">Not family. A former employer, a supervisor, an RWA secretary or a landlord — someone who has seen you work.</p>
          {[1, 2].map((n) => (
            <div key={n} className="mb-3 rounded-[14px] bg-paper p-4 last:mb-0">
              <div className="mb-3 text-[13px] font-medium text-text-2">Reference {n}</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Name"><input required name={`refName${n}`} className={input} placeholder="Suresh Nair" /></Field>
                <Field label="Phone"><input required name={`refPhone${n}`} className={input} placeholder="+91 98xxx xxxxx" /></Field>
                <Field label="How they know you"><input required name={`refRelation${n}`} className={input} placeholder="Reporting manager, 4 yrs" /></Field>
              </div>
            </div>
          ))}
        </Step>

        <Step n="05" title="Declarations">
          <p className="t-small -mt-2 mb-4">All eight are required. These are the terms of the engagement, not boilerplate.</p>
          <div className="grid gap-2">
            {declarations.map((d, i) => (
              <label key={d.t} className={cn("flex cursor-pointer items-start gap-3 rounded-[12px] border p-3.5 transition", decl[i] ? "border-accent bg-accent-tint" : "border-line-2 hover:border-ink/30")}>
                <input
                  type="checkbox"
                  required
                  checked={!!decl[i]}
                  onChange={(e) => setDecl((s) => ({ ...s, [i]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2 text-[14.5px] font-medium"><d.I size={15} className="mt-0.5 shrink-0 text-accent" /> {d.t}</span>
                  <span className="mt-0.5 block text-[13px] text-text-2">{d.b}</span>
                </span>
              </label>
            ))}
          </div>
        </Step>

        <Step n="06" title="Anything else">
          <Field label="Why you want to do this"><textarea className={cn(input, "h-28 py-3")} placeholder="What you've done before, and why you'd be good at walking into someone's empty home and writing down the truth." /></Field>
        </Step>

        {/* mobile submit — the sticky aside is desktop-only */}
        <div className="lg:hidden">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" /><button type="submit" disabled={!allDeclared || sending} className="btn btn-accent w-full disabled:opacity-40">{sending ? "Sending\u2026" : <>Submit application <ArrowRight size={16} /></>}</button>{sendError && <p role="alert" className="mt-3 rounded-[10px] bg-[#fbe6e6] p-3 text-[13px] text-[#8a2a2a]">{sendError} Please email stillyours.care@gmail.com instead.</p>}
          {!allDeclared && <p className="mt-2 text-center text-[12.5px] text-text-2">Tick all eight declarations to submit.</p>}
        </div>
      </div>

      {/* what happens next + the separate submit */}
      <aside className="grid gap-4 lg:sticky lg:top-[92px]">
        <div className="card bg-ink p-6 text-white sm:p-7">
          <div className="text-[13px] font-medium text-white/60">If shortlisted</div>
          <h3 className="mt-1 text-[19px] font-medium tracking-[-0.02em]">Eight stages before you visit a home alone</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">Every one happens in person or on a call with a real member of our team. None of it is automated, and none of it is skipped when we're busy.</p>
          <ol className="mt-5 space-y-3.5">
            {shortlistSteps.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/12 font-mono text-[11px] text-white">{i + 1}</span>
                <div>
                  <div className="text-[14px] font-medium">{s.t}</div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-white/65">{s.b}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-start gap-2.5 rounded-[12px] bg-white/[0.07] p-3.5">
            <Smartphone size={15} className="mt-0.5 shrink-0 text-white/60" />
            <p className="text-[12.5px] leading-snug text-white/65">We keep the network deliberately small. Most applications don't convert, and we'd rather tell you that early than string you along.</p>
          </div>
        </div>

        <div className="card hidden bg-white p-6 shadow-card lg:block">
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" /><button type="submit" disabled={!allDeclared || sending} className="btn btn-accent w-full disabled:opacity-40">{sending ? "Sending\u2026" : <>Submit application <ArrowRight size={16} /></>}</button>{sendError && <p role="alert" className="mt-3 rounded-[10px] bg-[#fbe6e6] p-3 text-[13px] text-[#8a2a2a]">{sendError} Please email stillyours.care@gmail.com instead.</p>}
          <p className="mt-3 text-center text-[12.5px] text-text-2">
            {allDeclared ? "We read every application ourselves." : `${Object.values(decl).filter(Boolean).length} of ${declarations.length} declarations ticked.`}
          </p>
        </div>
      </aside>
    </motion.form>
  );
}
