import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Three steps, shown honestly: how far in they are, and what is left. */
export function Steps({ at }: { at: 1 | 2 | 3 }) {
  const steps = ["About you", "Your property", "First visit"];
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < at;
        const on = n === at;
        return (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold transition",
              done ? "bg-pass text-white" : on ? "bg-accent text-white" : "bg-beige-2 text-text-3")}>
              {done ? <Check size={12} strokeWidth={3} /> : n}
            </span>
            <span className={cn("hidden text-[13px] font-medium sm:block", on ? "text-ink" : "text-text-3")}>{s}</span>
            {n < 3 && <span className={cn("h-px flex-1", done ? "bg-pass" : "bg-line")} />}
          </li>
        );
      })}
    </ol>
  );
}
