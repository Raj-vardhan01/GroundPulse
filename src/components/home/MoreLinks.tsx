import Link from "next/link";
import { ArrowRight, BadgeCheck, LandPlot, Sparkles, Users, Wrench } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";

/**
 * The homepage keeps only what a first-time visitor needs. Everything else lives
 * on its own page — this is the one place that points to all of it.
 */
const links = [
  { I: Wrench, t: "When something goes wrong", b: "What happens when a problem is flagged, the health score, and the app in your pocket.", href: "/how-it-works" },
  { I: LandPlot, t: "Plots & land", b: "Is anyone sitting on your land? Boundary walks with a GPS photo of every corner.", href: "/plots" },
  { I: Sparkles, t: "Coming home", b: "Flying in on Friday? A house that's cleaned and checked before you land.", href: "/cleaning" },
  { I: BadgeCheck, t: "Our inspectors", b: "How every inspector is verified, and the promises we hold ourselves to.", href: "/network" },
  { I: Users, t: "For owners", b: "Why not just ask a neighbour? And the two of us building this.", href: "/owners" },
];

export function MoreLinks() {
  return (
    <section className="section" aria-labelledby="more-title">
      <div className="wrap">
        <SectionHead
          title={<span id="more-title">Want the details?</span>}
          lede="Everything else has its own page."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(({ I, t, b, href }, i) => (
            <Reveal key={t} delay={i * 0.04}>
              <Link href={href} className="card group flex h-full flex-col bg-white p-6 shadow-card transition hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><I size={18} /></span>
                <div className="mt-4 text-[16px] font-medium">{t}</div>
                <p className="t-small mt-1.5 flex-1 text-[14px]">{b}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent">
                  Read more <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
