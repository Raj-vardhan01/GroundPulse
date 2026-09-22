import Link from "next/link";
import { ArrowRight, Check, Eye, MessageSquare, Repeat2, UserPlus } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";

const points = [
  {
    I: MessageSquare,
    t: "A favour gets you an opinion. A visit gets you a checklist.",
    b: "Sharma ji will tell you it looks fine, and he'll mean it. He won't open the meter box, run the geyser for ten minutes, or get down and feel under the bathroom sink — and you'd feel rude asking him to. An inspector does all forty-two of those things because that is the job.",
  },
  {
    I: Eye,
    t: "Nobody delivers bad news about your house for free.",
    b: "Someone doing you a favour softens it. 'Thoda seepage hai, ho jayega.' An inspector is paid to write down exactly what's there, photograph it, and is rated by you afterwards on whether they did.",
  },
  {
    I: Repeat2,
    t: "One look tells you little. Two identical ones tell you everything.",
    b: "Every visit runs the same checklist in the same order, so the next report lands beside the last one. 'Damp patch on the north wall: 4 cm in March, 11 cm in July' is a fact no one-off favour can ever give you — it only exists because both visits were done the same way.",
  },
];

/** Handles the obvious objection before it becomes a reason not to buy. */
export function Neighbour() {
  return (
    <section className="section" aria-labelledby="neighbour-title">
      <div className="wrap">
        <SectionHead
          eyebrow="The honest question"
          title={<span id="neighbour-title">&ldquo;Can&rsquo;t I just ask a neighbour to look?&rdquo;</span>}
          lede="You can, and for a quick glance you probably should — a good neighbour is worth a lot. It's the things a favour can't do that we're built for."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:gap-5">
          <div className="grid gap-3">
            {points.map(({ I, t, b }, i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="card flex h-full gap-4 bg-white p-5 shadow-card sm:p-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={17} /></span>
                  <div>
                    <div className="text-[16px] font-medium leading-snug">{t}</div>
                    <p className="t-small mt-1.5 text-[14px] leading-relaxed">{b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* the comparison a favour can't produce */}
          <Reveal delay={0.12}>
            <div className="card flex h-full flex-col bg-ink p-6 text-white sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">Bathroom 1 · north wall</span>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11.5px]">Same checklist item</span>
              </div>
              <div className="mt-4 grid gap-2.5">
                {[
                  { d: "12 Mar", s: "Damp patch, 4 cm across", tone: "warn" as const, n: "Flagged, no action needed yet" },
                  { d: "18 Jul", s: "Damp patch, 11 cm across", tone: "fail" as const, n: "Grown 175% — trap replaced, ₹3,300 approved" },
                ].map((r) => (
                  <div key={r.d} className="rounded-[12px] bg-white/[0.07] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[12px] text-white/55">{r.d}</span>
                      <span className={`chip ${r.tone === "fail" ? "chip-fail" : "chip-warn"}`}>{r.tone === "fail" ? "Fail" : "Attention"}</span>
                    </div>
                    <div className="mt-1.5 text-[15px] font-medium">{r.s}</div>
                    <div className="mt-0.5 text-[12.5px] text-white/60">{r.n}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-white/70">
                Four months apart, same inspector prompt, same photo angle. That comparison is the whole product — and it is the one thing a
                favour, however kind, can never build for you.
              </p>

              <div className="mt-auto flex items-start gap-3 rounded-[12px] bg-accent p-4 pt-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15"><UserPlus size={15} /></span>
                <div>
                  <div className="text-[14.5px] font-medium">Bring your neighbour anyway.</div>
                  <p className="mt-1 text-[13px] leading-snug text-white/80">
                    Want them at the door? Good. They can let the inspector in, walk the whole visit with the inspector, and they get the same
                    report you do. We&rsquo;d rather have another pair of eyes there.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-4">
          <div className="card flex flex-col gap-3 bg-beige px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2.5 text-[14.5px] text-text-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white"><Check size={12} strokeWidth={3} /></span>
              See what a finished report actually looks like before you decide.
            </span>
            <Link href="/sample-report" className="btn btn-white btn-sm shrink-0">Open a sample report <ArrowRight size={15} /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
