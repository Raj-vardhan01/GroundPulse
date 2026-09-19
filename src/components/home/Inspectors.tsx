import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { site } from "@/lib/site";

export function Inspectors() {
  return (
    <section className="section pt-0 md:pt-0" aria-labelledby="inspectors-title">
      <div className="wrap">
        <SectionHead title={<span id="inspectors-title">Meet the people who'll walk your home</span>} lede="Real names, real faces before every visit. Police-verified, referenced, trial-tested — and rated by owners after every job." action={<Link href="/network" className="btn btn-white btn-sm">How we select <ArrowRight size={15} /></Link>} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {site.inspectors.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <div className="card h-full bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-[16px] font-medium text-white">{p.initials}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[16px] font-medium">{p.name} <BadgeCheck size={16} className="text-accent" /></div>
                    <div className="truncate text-[13px] text-text-2">{p.area}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[10px] bg-paper py-2"><div className="text-[17px] font-medium tracking-[-0.02em]">{p.visits}</div><div className="text-[11px] text-text-2">visits</div></div>
                  <div className="rounded-[10px] bg-paper py-2"><div className="flex items-center justify-center gap-1 text-[17px] font-medium tracking-[-0.02em]"><Star size={13} className="fill-warn text-warn" />{p.rating}</div><div className="text-[11px] text-text-2">rating</div></div>
                  <div className="rounded-[10px] bg-paper py-2"><div className="text-[17px] font-medium tracking-[-0.02em]">{p.since}</div><div className="text-[11px] text-text-2">since</div></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="chip chip-pass">Police-verified</span><span className="chip">2 references</span><span className="chip">Trial passed</span>
                </div>
                <p className="t-small mt-3">{p.bg}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
