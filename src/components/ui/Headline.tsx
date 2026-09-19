"use client";

import { motion } from "framer-motion";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  lines: React.ReactNode[];
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  id?: string;
  /** play on mount instead of on scroll (hero) */
  immediate?: boolean;
};

/** Line-masked headline reveal. Each line slides up from a clipped box. */
export function Headline({ lines, className, as = "h2", delay = 0, id, immediate }: Props) {
  const Tag = as;
  return (
    <Tag id={id} className={cn(className)}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className="block will-change-transform"
            initial={{ y: "105%" }}
            {...(immediate ? { animate: { y: 0 } } : { whileInView: { y: 0 }, viewport: viewportOnce })}
            transition={{ duration: 1, delay: delay + i * 0.09, ease: EASE }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
