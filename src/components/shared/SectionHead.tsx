import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHead({ eyebrow, title, lede, align = "left", className, serif, action }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; align?: "left" | "center"; className?: string; serif?: boolean; action?: React.ReactNode }) {
  return (
    <Reveal className={cn(align === "center" ? "mx-auto max-w-[760px] text-center" : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn(align === "center" ? "" : "max-w-[720px]")}>
        {eyebrow && <p className="t-label mb-3">{eyebrow}</p>}
        <h2 className={cn(serif ? "serif t-display" : "t-1", "text-balance")}>{title}</h2>
        {lede && <p className={cn("t-lede mt-4 text-text-2", align === "center" ? "mx-auto max-w-[60ch]" : "max-w-[56ch]")}>{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
