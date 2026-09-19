import { cn } from "@/lib/cn";

export function Mark({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M6 20h5l2.4-6.5 3 10.5 3.2-13 2.6 9H26" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark />
      <span className={cn("text-[18px] font-bold tracking-[-0.035em]", inverted ? "text-white" : "text-ink")}>GroundPulse</span>
    </span>
  );
}
