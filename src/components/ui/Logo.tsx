import Image from "next/image";
import { cn } from "@/lib/cn";

/* Both halves are the artwork itself, matted off their cream ground so the
   letter counters and the lit window read as holes — on cream, on white
   cards, anywhere. The ratios are the trimmed bounding boxes. */
const MARK = 678 / 763;
const WORD = 1054 / 251;

export function Mark({ className, size = 38, inverted }: { className?: string; size?: number; inverted?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden
      width={Math.round(size * MARK)}
      height={size}
      priority
      className={cn("shrink-0 select-none", inverted && "brightness-0 invert", className)}
    />
  );
}

export function Wordmark({ className, size = 27, inverted }: { className?: string; size?: number; inverted?: boolean }) {
  return (
    <Image
      src="/wordmark.png"
      alt="Still Yours"
      width={Math.round(size * WORD)}
      height={size}
      priority
      className={cn("shrink-0 select-none", inverted && "brightness-0 invert", className)}
    />
  );
}

export function Logo({ className, inverted, size = 38 }: { className?: string; inverted?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Mark size={size} inverted={inverted} />
      <Wordmark size={Math.round(size * 0.72)} inverted={inverted} />
    </span>
  );
}
