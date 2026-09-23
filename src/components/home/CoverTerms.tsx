import { Check, X } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { carePlusCover as c, inr } from "@/lib/pricing";
import { cn } from "@/lib/cn";

export function CoverTerms() {
  return (
    <section id="cover-terms" className="section scroll-mt-24" aria-labelledby="cover-title">
      <div className="wrap">
        <SectionHead title={<span id="cover-title">Care+ cover — the terms, in plain language</span>} lede={`Care+ covers up to ${inr(c.yearly)} of repairs a year. Here is exactly how that works, so there are no surprises on either side.`} />
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:gap-5">
          <Reveal>
            <ol className="card divide-y divide-line bg-white shadow-card">
              {c.terms.map((t, i) => (
                <li key={t.t} className="flex gap-4 p-5 sm:p-6">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-medium text-white">{i + 1}</span>
                  <div><div className="text-[16px] font-medium">{t.t}</div><p className="t-small mt-1 text-[14px]">{t.b}</p></div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card h-full bg-beige p-5 sm:p-6">
              <div className="text-[16px] font-medium">Not covered</div>
              <p className="t-small mt-1">We'll still inspect it, quote it and fix it if you approve — it just isn't part of the ₹20,000.</p>
              <ul className="mt-4 space-y-2">
                {c.excluded.map((e) => <li key={e} className="flex items-start gap-2.5 text-[14px]"><span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-fail-soft text-fail"><X size={11} strokeWidth={3} /></span>{e}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-4">
          <div className="card bg-white p-5 shadow-card sm:p-6">
            <div className="text-[16px] font-medium">How it plays out</div>
            <div className="mt-3 divide-y divide-line">
              {c.examples.map((e) => (
                <div key={e.s} className="grid gap-1 py-3 sm:grid-cols-[1fr_110px_1.1fr] sm:items-center sm:gap-4">
                  <div className="text-[14.5px]">{e.s}</div>
                  <div className="text-[14px] text-text-2 sm:text-right">{e.cost}</div>
                  <div className={cn("flex items-center gap-2 text-[14px] font-medium", e.ok ? "text-[#157a44]" : "text-text-2")}>
                    <span className={cn("grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full", e.ok ? "bg-pass-soft text-pass" : "bg-beige-2 text-text-2")}>{e.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}</span>{e.r}
                  </div>
                </div>
              ))}
            </div>
            <p className="t-small mt-4">Cover starts with your first inspection and resets every plan year. Every repair is quoted by a verified provider — quote + a 15% Still Yours fee, shown to you in full — and approved by you before any work starts. Repairs inside the cover carry no fee. Full terms are on our terms page.</p>
          </div>
        </Reveal>

        {/* visit guarantee */}
        <Reveal className="mt-10">
          <div id="guarantee" className="card grid gap-6 bg-ink p-6 text-white sm:p-8 md:grid-cols-[1.2fr_1fr] md:items-center md:p-10">
            <div>
              <p className="text-[16px] font-medium text-white/70">Our promise · every plan, every visit</p>
              <h3 className="t-2 mt-1 max-w-[16ch]">We fix what we damage.</h3>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/75">If we break something while we're inside — a fitting, a tile, a pipe — we repair or replace it at our cost. It's built so that rarely happens: one verified person, every room on video, and an exit walkthrough before they leave.</p>
            </div>
            <ol className="grid gap-2">
              {["One verified person, in only after you confirm · GPS + time on every photo", "Every room on video, plus an exit walkthrough before leaving", "Something off? Tell us on WhatsApp — any time until your next visit", "Anything we damaged, we fix at our cost. Cupboards and lockers are never opened — keep cash, jewellery and documents locked away."].map((t, i) => (
                <li key={t} className="flex items-start gap-3 rounded-[12px] bg-white/[0.07] px-4 py-3 text-[14px]"><span className="mt-px shrink-0 text-white/40">0{i + 1}</span>{t}</li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
