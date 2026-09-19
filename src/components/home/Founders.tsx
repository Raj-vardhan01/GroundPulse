import { PenLine, Quote } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

/** Each founder gets a full panel and their own story, in their own words. */
export function Founders() {
  return (
    <section className="section" aria-labelledby="founders-title">
      <div className="wrap">
        <SectionHead
          eyebrow="How this started"
          title={<span id="founders-title">We were already paying for this problem</span>}
          lede="Raj's family paid for their house twice over — once in flights, once in repairs. He brought the idea to Naitik, who recognised it before the call was over. Here's each of us, in our own words, not a company voice."
        />

        <div className="mt-10 grid gap-4 md:mt-12">
          {site.founders.map((f, i) => {
            const dark = i % 2 === 1;
            const told = f.story.length > 0;
            return (
              <Reveal key={f.name} delay={i * 0.08}>
                <article
                  className={cn(
                    "panel relative overflow-hidden p-6 sm:p-9 md:p-12",
                    dark ? "on-dark bg-ink" : "bg-white shadow-card",
                  )}
                >
                  <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-14">
                    {/* identity rail */}
                    <div className="flex items-start gap-5 lg:flex-col lg:items-stretch lg:gap-0">
                      <div className="relative h-[86px] w-[86px] shrink-0 self-start sm:h-[104px] sm:w-[104px]">
                        {/* tilted card behind the tile, for depth */}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-0 -rotate-6 rounded-[22px]",
                            dark ? "bg-white/10" : "bg-accent-soft",
                          )}
                        />
                        <span
                          className={cn(
                            "relative grid h-full w-full place-items-center rounded-[22px] text-[28px] font-medium tracking-[-0.02em] sm:text-[34px]",
                            dark ? "bg-white text-ink" : "bg-accent text-white",
                          )}
                        >
                          {f.initials}
                        </span>
                      </div>
                      <div className="lg:mt-6">
                        <span className={cn("font-mono text-[12px]", dark ? "text-white/45" : "text-text-3")}>
                          0{i + 1}
                        </span>
                        <h3 className="mt-1 text-[21px] font-medium tracking-[-0.025em] sm:text-[23px]">{f.name}</h3>
                        <p className={cn("mt-0.5 text-[14px]", dark ? "text-white/65" : "text-text-2")}>{f.role}</p>
                        <p className={cn("mt-3 text-[13px]", dark ? "text-white/55" : "text-text-3")}>{f.place}</p>
                      </div>
                    </div>

                    {/* the story */}
                    <div className={cn("lg:border-l lg:pl-14", dark ? "lg:border-white/12" : "lg:border-line")}>
                      {told ? (
                        <>
                          <Quote
                            size={26}
                            className={cn("mb-4", dark ? "text-white/25" : "text-accent/30")}
                            strokeWidth={1.5}
                          />
                          <p
                            className={cn(
                              "serif text-balance text-[24px] leading-[1.18] sm:text-[30px] md:text-[34px]",
                              dark ? "text-white" : "text-ink",
                            )}
                          >
                            {f.quote}
                          </p>
                          <div className={cn("my-7 h-px w-full", dark ? "bg-white/12" : "bg-line")} />
                          <div className="space-y-4">
                            {f.story.map((p, k) => (
                              <p
                                key={k}
                                className={cn(
                                  "max-w-[64ch] text-[15.5px] leading-relaxed",
                                  dark ? "text-white/75" : "text-text-2",
                                )}
                              >
                                {p}
                              </p>
                            ))}
                          </div>
                          <div className="mt-8 flex items-center gap-4">
                            <span className={cn("hand -rotate-3 text-[30px] leading-none", dark ? "text-white" : "text-accent-2")}>
                              {f.sign}
                            </span>
                            <span className={cn("h-px flex-1", dark ? "bg-white/15" : "bg-line")} />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full flex-col justify-center">
                          <p
                            className={cn(
                              "serif text-balance text-[22px] leading-[1.2] sm:text-[26px]",
                              dark ? "text-white" : "text-ink",
                            )}
                          >
                            {f.line}
                          </p>
                          <div
                            className={cn(
                              "mt-7 flex items-start gap-3 rounded-[16px] p-5",
                              dark ? "bg-white/[0.07]" : "bg-beige",
                            )}
                          >
                            <PenLine size={17} className={cn("mt-0.5 shrink-0", dark ? "text-white/60" : "text-accent")} />
                            <p className={cn("text-[14.5px] leading-relaxed", dark ? "text-white/70" : "text-text-2")}>
                              {f.name.split(" ")[0]} is writing his side of this — why the idea wouldn't leave him alone, and what he's building to keep the promise honest. It goes here, in his own words.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
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
