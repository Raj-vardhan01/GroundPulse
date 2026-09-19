import { BadgeIndianRupee, RotateCcw, ShieldCheck, ThumbsUp } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/site";

const guarantees = [
  { I: ThumbsUp, t: "You approve every rupee", b: "No repair, no cleaning, no part is bought without your yes on the exact amount. A flagged issue is a question, not an invoice." },
  { I: RotateCcw, t: "Cancel in 30 days, 75% back", b: "Change your mind on a yearly plan in the first 30 days and we refund 75% — a flat 25% is retained. No questions and no retention call." },
  { I: ShieldCheck, t: "₹1,00,000 if we're ever wrong", b: "Theft or damage during a visit is ours to pay, not yours to prove. It has never come up — the promise stands anyway." },
  { I: BadgeIndianRupee, t: "Never a rupee of commission", b: "We don't broker tenants and we don't mark up bills. The provider's quote + a flat 10%, shown to you before you approve." },
];

/** The trust anchor: a signed note from a founder + the four zero-risk guarantees. */
export function Guarantee() {
  const f = site.founders.find((x) => x.id === "naitik") ?? site.founders[0];
  return (
    <section className="section" aria-labelledby="guarantee-title">
      <div className="wrap">
        <Reveal>
          <div className="panel overflow-hidden bg-white shadow-card">
            <div className="grid lg:grid-cols-[1.05fr_1fr]">
              {/* the note */}
              <div className="relative p-7 sm:p-10 md:p-12">
                <p className="t-label">A note from a founder</p>
                <h2 id="guarantee-title" className="t-2 mt-3 max-w-[18ch]">We're asking you to let a stranger into your home.</h2>
                <div className="t-body mt-5 max-w-[52ch] space-y-3.5 text-[15.5px] leading-relaxed text-text-2">
                  <p>For years, the only update my family got on a house we couldn't reach was somebody telling us sab theek hai. It was always meant kindly. It was never once proof.</p>
                  <p>GroundPulse exists so nobody has to settle for that. But I know exactly what we're asking of you in return — and a nice website is not a reason to hand a stranger your keys.</p>
                  <p className="text-text">So here's our side of it. Whoever walks in is police-verified and gets in only with your OTP. Every room is on video, and you can watch it live. And if anything ever goes wrong on a visit, it's ₹1,00,000 from us — not an argument about whose fault it was.</p>
                  <p className="text-text">If any of that doesn't happen exactly as written, the four promises on the right are what you hold us to.</p>
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <span className="hand -rotate-3 text-[30px] leading-none text-accent-2">{f.name.split(" ")[0]}</span>
                  <div className="h-8 w-px bg-line" />
                  <div>
                    <div className="text-[14.5px] font-medium">{f.name}</div>
                    <div className="text-[13px] text-text-2">{f.role}</div>
                  </div>
                </div>
              </div>

              {/* the guarantees */}
              <div className="relative bg-accent p-7 text-white sm:p-10 md:p-12">
                {/* stamp */}
                <span aria-hidden className="absolute right-6 top-6 hidden h-[86px] w-[86px] -rotate-12 place-items-center rounded-full text-center text-white/85 shadow-[inset_0_0_0_2px_currentColor] sm:grid md:right-9 md:top-9">
                  <span className="text-[19px] font-medium leading-none">100%</span>
                  <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.14em]">Your call</span>
                </span>
                <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/60">In writing</p>
                <h3 className="t-3 mt-3 max-w-[20ch] text-[22px] text-white sm:text-[25px]">You stay in control, right down to the way out.</h3>
                <ul className="mt-7 space-y-5">
                  {guarantees.map(({ I, t, b }) => (
                    <li key={t} className="flex gap-3.5">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><I size={16} /></span>
                      <div>
                        <div className="text-[15.5px] font-medium">{t}</div>
                        <p className="mt-1 text-[13.5px] leading-snug text-white/75">{b}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t border-white/15 pt-5 text-[13px] text-white/65">{site.company} · {site.address} · {site.email}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
