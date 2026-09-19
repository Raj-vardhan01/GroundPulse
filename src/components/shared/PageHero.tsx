import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function PageHero({ eyebrow, title, lede, children, className, tone = "beige" }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; children?: React.ReactNode; className?: string; tone?: "beige" | "white" | "accent" }) {
  return (
    <section className={cn("pt-[88px] md:pt-[100px]", className)}>
      <div className="wrap">
        <div className={cn("panel overflow-hidden px-5 py-14 text-center sm:px-8 md:py-20", tone === "beige" && "bg-beige", tone === "white" && "border border-line bg-white", tone === "accent" && "on-dark bg-accent")}>
          <Reveal className="mx-auto max-w-[820px]">
            {eyebrow && <p className={cn("t-label", tone === "accent" && "text-white/70")}>{eyebrow}</p>}
            <h1 className={cn("serif t-display mt-4 text-balance", tone === "accent" && "text-white")}>{title}</h1>
            {lede && <p className={cn("t-lede mx-auto mt-5 max-w-[58ch]", tone === "accent" && "text-white/80")}>{lede}</p>}
          </Reveal>
          {children}
        </div>
      </div>
    </section>
  );
}
