import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/** Opendoor's "For agents" block → our hand-picked inspector network. */
export function NetworkTeaser() {
  return (
    <section className="section pt-0 md:pt-0">
      <div className="wrap">
        <Reveal>
          <div className="card relative overflow-hidden bg-tint p-7 sm:p-10 md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="text-[18px] font-medium text-text-2 sm:text-[20px]">Our inspectors</p>
                <h2 className="t-1 mt-1 max-w-[16ch]">People we'd hand our own keys to</h2>
                <p className="t-body mt-4 max-w-[46ch] text-text-2">Invite-only. Every inspector is referred or scouted, vetted in person, and verified before their first visit. Owners rate every job — and the network stays small on purpose.</p>
                <Link href="/network" className="btn btn-accent mt-6">How we select <ArrowRight size={16} /></Link>
              </div>
              <div className="relative mx-auto w-full max-w-[340px]">
                <div className="card rotate-[3deg] bg-white p-5 shadow-float">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-[14px] font-bold text-white">SM</span>
                    <div><div className="flex items-center gap-1.5 text-[16px] font-medium">Suresh M. <BadgeCheck size={16} className="text-accent" /></div><div className="t-small">Plumbing · Malviya Nagar, Jaipur</div></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[["212", "jobs"], ["4.9", "rating"], ["2019", "since"]].map(([v, l]) => <div key={l} className="rounded-[10px] bg-paper py-2"><div className="text-[18px] font-medium tracking-[-0.02em]">{v}</div><div className="text-[11px] text-text-2">{l}</div></div>)}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[12px] text-text-2">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={12} className="fill-warn text-warn" />)}<span className="ml-1">"Fixed the trap, sent photos, no drama." — Priya S.</span></div>
                </div>
                <div className="absolute -left-4 -top-4 rotate-[-8deg] rounded-full bg-accent px-3 py-1.5 text-[12px] font-medium text-white shadow-card">Hand-picked · Verified ✓</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
