import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { site } from "@/lib/site";

export function Founders() {
  return (
    <section className="section" aria-labelledby="founders-title">
      <div className="wrap">
        <SectionHead title={<span id="founders-title">Built by people with a home 2,000 km away</span>} lede="We're two founders in Bengaluru with parents' houses in other cities and the same 11 PM worry you have. GroundPulse is the thing we wished existed." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {site.founders.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.08}>
              <div className="card flex h-full gap-5 bg-white p-6 shadow-card sm:p-7">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-[20px] font-medium text-white">{f.initials}</span>
                <div>
                  <div className="text-[18px] font-medium">{f.name}</div>
                  <div className="text-[13.5px] text-text-2">{f.role}</div>
                  <p className="t-body mt-3 text-[15px] text-text-2">{f.line}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-4">
          <div className="card flex flex-col gap-2 bg-beige px-6 py-5 text-[13.5px] text-text-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{site.company} · {site.address}</span>
            <span>{site.email}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
