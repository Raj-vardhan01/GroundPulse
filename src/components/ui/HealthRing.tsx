"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Props = { score: number; size?: number; stroke?: number; className?: string; label?: string; delay?: number; dark?: boolean };

export function ringColor(score: number) {
  if (score < 40) return "var(--fail)";
  if (score < 70) return "var(--warn)";
  return "var(--pass)";
}

export function HealthRing({ score, size = 120, stroke = 9, className, label, delay = 0.2, dark }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18, mass: 1 });
  const dash = useTransform(spring, (v) => c - (c * v) / 100);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, score, { duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, score, mv, delay]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  const color = dark ? (score >= 70 ? "#7be3a5" : score >= 40 ? "#f4c65a" : "#ff7a7a") : ringColor(score);
  return (
    <div ref={ref} className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }} role="img" aria-label={`Health score ${score} of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(26,26,26,0.08)"} strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={c} style={{ strokeDashoffset: dash }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-bold tabular-nums tracking-[-0.04em]" style={{ fontSize: size * 0.32, color: dark ? "#fff" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{display}</div>
          {label && <div className={cn("mt-1 font-semibold uppercase tracking-[0.06em] text-text-3", dark && "text-white/50")} style={{ fontSize: Math.max(9, size * 0.085) }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}
