import { BadgeCheck, KeyRound, PhoneCall, ShieldCheck, ThumbsUp, Video } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export const relaxPoints = [
  { I: BadgeCheck, t: "You know who's coming.", b: "Name, photo and police-verified badge on your phone before the visit." },
  { I: KeyRound, t: "They can't enter without you.", b: "The door opens with your (or your caretaker's) OTP. No OTP, no checklist." },
  { I: Video, t: "Every room is on video.", b: "Each room you listed is a required video. Skip one and the visit can't be submitted. Exit walkthrough before leaving." },
  { I: PhoneCall, t: "Watch the visit live, if you want.", b: "The inspector video-calls you at the start and the end — you, your parents or your caretaker see it live, from anywhere." },
  { I: ThumbsUp, t: "Nothing happens without your yes.", b: "Repairs, cleaning, money — your approval first, with the exact amount." },
  { I: ShieldCheck, t: "Protected up to ₹1,00,000.", b: "For the very, very rare case. With a system this tight it almost never comes up — but if it ever does, we pay. Not you.", hero: true },
];

export const relaxTagline = "One verified person. Your OTP. Every room on video — live if you want. Your approval for everything. And ₹1,00,000 if we're ever wrong.";

/** The same five lines everywhere — repetition is what builds the trust. */
export function Relax({ variant = "strip", className }: { variant?: "strip" | "dark" | "list"; className?: string }) {
  if (variant === "dark") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-[13px] font-medium text-white/60">Why you can relax</div>
        <ul className="space-y-2.5">
          {relaxPoints.map(({ I, t, b, hero }) => (
            <li key={t} className={cn("flex items-start gap-2.5 text-[13px]", hero && "rounded-[10px] bg-white/10 p-2.5")}>
              <I size={14} className="mt-[3px] shrink-0 text-[#7be3a5]" />
              <span><span className="font-medium text-white">{t}</span> <span className="text-white/65">{b}</span></span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-white/55">Cupboards and lockers are never opened. Lock cash and jewellery away — the rest is on us.</p>
      </div>
    );
  }
  if (variant === "list") {
    return (
      <ul className={cn("grid gap-3", className)}>
        {relaxPoints.map(({ I, t, b, hero }) => (
          <li key={t} className={cn("flex items-start gap-3 rounded-[12px] p-3.5 text-[14.5px]", hero ? "bg-accent text-white" : "bg-white shadow-card")}>
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", hero ? "bg-white/15 text-white" : "bg-accent-soft text-accent")}><I size={16} /></span>
            <span><span className="font-medium">{t}</span> <span className={hero ? "text-white/85" : "text-text-2"}>{b}</span></span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section className={cn("wrap mt-4 md:mt-6", className)} aria-label="Why you can relax">
      <Reveal>
        <div className="card overflow-hidden bg-white shadow-card">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-[16px] font-medium">Why you can relax</div>
            <div className="text-[13px] text-text-2">{relaxTagline}</div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {relaxPoints.map(({ I, t, b, hero }, i) => (
              <li key={t} className={cn("flex items-start gap-3 p-5", i > 0 && "border-t border-line sm:border-t-0", i % 2 === 1 && "sm:border-l sm:border-line lg:border-l", i >= 2 && "sm:border-t sm:border-line lg:border-t-0", i > 0 && "lg:border-l lg:border-line", hero && "bg-accent-tint")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", hero ? "bg-accent text-white" : "bg-accent-soft text-accent")}><I size={17} /></span>
                <div><div className="text-[14.5px] font-medium leading-tight">{t}</div><div className="t-small mt-1 text-[13px]">{b}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
