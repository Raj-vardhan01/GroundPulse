import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";

export const people = [
  { name: "Priya S.", role: "NRI owner · Dubai → Jaipur", q: "I approved a plumber from my desk in Dubai and had after-photos before dinner. I haven't flown home 'just to check' since.", tag: "Quarterly inspections", c: "bg-accent text-white" },
  { name: "Arvind R.", role: "Investor · 5 units, 2 cities", q: "Five properties, five agents, five versions of the truth. Now it's one dashboard, one score per unit, and I know which one to worry about.", tag: "Multi-property overview", c: "bg-beige-2 text-ink" },
  { name: "Fatima K.", role: "Vacation home · Goa", q: "The house sits empty for nine months. The inspector caught a balcony drainage issue in July that would have flooded the room by monsoon's end.", tag: "Flagged before it got expensive", c: "bg-ink text-white" },
];

export function Owners() {
  return (
    <section className="section" aria-labelledby="owners-title">
      <div className="wrap">
        <SectionHead title={<span id="owners-title">Hear from owners who stopped guessing</span>} lede="Different lives, same 11 PM worry. Each of them gets the same thing now: a true, timestamped picture — and control." />
      </div>
      <div className="wrap mt-10 md:mt-14">
        <div className="hscroll -mx-[var(--gutter)] px-[var(--gutter)] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {people.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08} className="w-[82vw] max-w-[380px] md:w-auto md:max-w-none">
              <figure className={`card flex h-full min-h-[320px] flex-col justify-between p-6 sm:p-7 ${p.c} ${p.c.includes("text-white") ? "" : "shadow-card"}`}>
                <blockquote className="serif text-[1.5rem] leading-[1.22] tracking-[-0.01em] sm:text-[1.65rem]">"{p.q}"</blockquote>
                <figcaption className="mt-8">
                  <div className="text-[15px] font-semibold">{p.name}</div>
                  <div className={`text-[13px] ${p.c.includes("text-white") ? "text-white/70" : "text-text-2"}`}>{p.role}</div>
                  <div className={`mt-3 inline-flex h-7 items-center rounded-full px-3 text-[12px] font-semibold ${p.c.includes("text-white") ? "bg-white/15" : "bg-white"}`}>{p.tag}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
