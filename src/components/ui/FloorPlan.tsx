"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";

type Verdict = "pass" | "warn" | "fail";
type Room = { id: string; name: string; rect: [number, number, number, number]; m: [number, number]; side: "top" | "bottom" | "left" | "right"; verdict: Verdict; at: number; label?: string };

const rooms: Room[] = [
  { id: "entrance", name: "Entry", rect: [0, 250, 130, 190], m: [60, 345], side: "top", verdict: "pass", at: 0.5 },
  { id: "living", name: "Living", rect: [0, 0, 320, 250], m: [150, 120], side: "bottom", verdict: "pass", at: 1.0 },
  { id: "kitchen", name: "Kitchen", rect: [320, 0, 170, 250], m: [400, 140], side: "bottom", verdict: "pass", at: 2.7 },
  { id: "balcony", name: "Balcony", rect: [490, 0, 150, 250], m: [560, 140], side: "bottom", verdict: "pass", at: 3.4 },
  { id: "bedroom", name: "Bedroom", rect: [260, 250, 380, 190], m: [450, 340], side: "right", verdict: "warn", at: 6.9, label: "Lock" },
  { id: "bath", name: "Bath", rect: [130, 250, 130, 190], m: [195, 317], side: "bottom", verdict: "fail", at: 8.0, label: "Leak" },
];
const trace = "M60 440 V345 H112 V120 H400 V140 H560 H400 V120 H150 V200 H287 V340 H450 H287 V317 H195";

const fill: Record<Verdict, string> = { pass: "rgba(30,158,90,0.10)", warn: "rgba(217,154,26,0.18)", fail: "rgba(214,69,69,0.16)" };
const stroke: Record<Verdict, string> = { pass: "#1e9e5a", warn: "#d99a1a", fail: "#d64545" };
const glyph: Record<Verdict, string> = { pass: "✓", warn: "!", fail: "×" };

type Theme = { paper: string; wall: string; thin: string; fixture: string; grid: string; label: string; trace: string; markerFill: string; labelFill: string; labelText: string; fill: Record<Verdict, string> };
const themes: Record<"light" | "dark", Theme> = {
  light: { paper: "#f4efec", wall: "#23201d", thin: "rgba(35,32,29,0.55)", fixture: "rgba(35,32,29,0.28)", grid: "rgba(35,32,29,0.06)", label: "rgba(35,32,29,0.5)", trace: "var(--accent)", markerFill: "#fff", labelFill: "#fff", labelText: "#23201d", fill },
  dark: { paper: "#23201d", wall: "rgba(255,255,255,0.85)", thin: "rgba(255,255,255,0.4)", fixture: "rgba(255,255,255,0.22)", grid: "rgba(255,255,255,0.05)", label: "rgba(255,255,255,0.5)", trace: "#6ee7b7", markerFill: "#23201d", labelFill: "#23201d", labelText: "#fff", fill: { pass: "rgba(110,231,183,0.12)", warn: "rgba(242,198,99,0.2)", fail: "rgba(255,122,122,0.22)" } },
};
const strokeDark: Record<Verdict, string> = { pass: "#6ee7b7", warn: "#f2c663", fail: "#ff7a7a" };

export function FloorPlan({ className, loop = true, theme = "light" }: { className?: string; loop?: boolean; theme?: "light" | "dark" }) {
  const T = themes[theme];
  const PAPER = T.paper, wall = T.wall, thin = T.thin, fixture = T.fixture;
  const strokeOf = theme === "dark" ? strokeDark : stroke;
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [cycle, setCycle] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!inView || !loop || reduced) return;
    const t = setInterval(() => setCycle((c) => c + 1), 13000);
    return () => clearInterval(t);
  }, [inView, loop, reduced]);

  return (
    <svg ref={ref} viewBox="-8 -8 656 456" className={cn("h-auto w-full", className)} role="img" aria-label="Animated floor plan showing an inspector's route through each room, with a verdict per room">
      <defs>
        <pattern id={`fp-grid-${theme}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={T.grid} /></pattern>
      </defs>
      <rect x="0" y="0" width="640" height="440" fill={`url(#fp-grid-${theme})`} />

      {inView && rooms.map((r) => (
        <motion.rect key={`${cycle}-f-${r.id}`} x={r.rect[0]} y={r.rect[1]} width={r.rect[2]} height={r.rect[3]} fill={T.fill[r.verdict]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : r.at, duration: 0.8 }} />
      ))}

      {/* fixtures */}
      <g stroke={fixture} fill="none" strokeWidth="1.5">
        <rect x="40" y="150" width="150" height="46" rx="8" /><rect x="40" y="150" width="150" height="14" rx="6" />
        <rect x="80" y="90" width="70" height="36" rx="4" /><rect x="30" y="20" width="120" height="8" rx="2" />
        <path d="M330 10 V 200 H 480" strokeWidth="18" stroke={theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(35,32,29,0.08)"} />
        <rect x="325" y="60" width="18" height="34" rx="3" />
        <circle cx="405" cy="199" r="7" /><circle cx="425" cy="199" r="7" /><circle cx="445" cy="199" r="7" />
        <path d="M500 12 H 630 M500 24 H 630" />
        {[0,1,2,3,4,5,6].map(i => <line key={i} x1={510 + i*20} y1="12" x2={510 + i*20} y2="24" />)}
        <rect x="470" y="300" width="150" height="110" rx="8" /><rect x="480" y="306" width="60" height="24" rx="4" /><rect x="550" y="306" width="60" height="24" rx="4" />
        <rect x="280" y="400" width="140" height="22" rx="3" />
        <rect x="150" y="270" width="40" height="40" rx="6" /><ellipse cx="220" cy="290" rx="16" ry="11" />
        <rect x="150" y="360" width="60" height="60" rx="4" strokeDasharray="4 3" />
        <rect x="20" y="380" width="70" height="20" rx="3" />
      </g>

      {/* walls */}
      <g fill="none" strokeLinecap="square">
        <rect x="0" y="0" width="640" height="440" stroke={wall} strokeWidth="5" />
        <g stroke={thin} strokeWidth="2.5">
          <path d="M320 0 V 250" /><path d="M490 0 V 250" /><path d="M0 250 H 640" /><path d="M130 250 V 440" /><path d="M260 250 V 440" />
        </g>
        <g stroke={thin} strokeWidth="1.5">
          <path d="M40 440 a40 40 0 0 1 40 -40" /><line x1="40" y1="440" x2="80" y2="440" stroke={PAPER} strokeWidth="6" />
          <path d="M95 250 a34 34 0 0 1 34 -34" /><line x1="95" y1="250" x2="129" y2="250" stroke={PAPER} strokeWidth="5" />
          <path d="M270 250 a34 34 0 0 0 34 34" /><line x1="270" y1="250" x2="304" y2="250" stroke={PAPER} strokeWidth="5" />
          <path d="M130 300 a34 34 0 0 1 34 -34" /><line x1="130" y1="266" x2="130" y2="300" stroke={PAPER} strokeWidth="5" />
          <path d="M260 334 a34 34 0 0 1 -34 -34" /><line x1="260" y1="300" x2="260" y2="334" stroke={PAPER} strokeWidth="5" />
          <path d="M320 150 a34 34 0 0 1 34 -34" /><line x1="320" y1="116" x2="320" y2="150" stroke={PAPER} strokeWidth="5" />
          <path d="M490 170 a34 34 0 0 1 34 -34" /><line x1="490" y1="136" x2="490" y2="170" stroke={PAPER} strokeWidth="5" />
        </g>
      </g>

      {/* room labels */}
      <g fontFamily="var(--font-sans)" fontSize="11.5" fontWeight="600" letterSpacing="1.2" fill={T.label}>
        <text x="16" y="60">LIVING</text><text x="352" y="36">KITCHEN</text><text x="504" y="60">BALCONY</text>
        <text x="16" y="282">ENTRY</text><text x="146" y="342">BATH</text><text x="276" y="282">BEDROOM</text>
      </g>

      {/* inspector trace */}
      {inView && (
        <motion.path key={`${cycle}-trace`} d={trace} fill="none" stroke={T.trace} strokeWidth="2.4" strokeDasharray="6 7" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: reduced ? 0 : 8.2, ease: "linear" }, opacity: { duration: 0.3 } }} />
      )}

      {/* verdict markers */}
      {inView && rooms.map((r) => {
        const [cx, cy] = r.m;
        const c = strokeOf[r.verdict];
        const label = `${r.name}${r.label ? " · " + r.label : ""}`;
        const w = label.length * 7.6 + 22;
        const pos = r.side === "right" ? [cx + 22, cy - 12] : r.side === "left" ? [cx - 22 - w, cy - 12] : r.side === "top" ? [cx - w / 2, cy - 22 - 24] : [cx - w / 2, cy + 22];
        return (
          <motion.g key={`${cycle}-m-${r.id}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduced ? 0 : r.at, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {r.verdict !== "pass" && (
              <motion.circle cx={cx} cy={cy} r="14" fill={c} initial={{ opacity: 0.5, scale: 0.6 }} animate={{ opacity: 0, scale: 2.4 }} transition={{ delay: r.at + 0.3, duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: "easeOut" }} style={{ transformOrigin: `${cx}px ${cy}px` }} />
            )}
            <circle cx={cx} cy={cy} r="14" fill={T.markerFill} stroke={c} strokeWidth="2.5" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={c} fontFamily="var(--font-sans)">{glyph[r.verdict]}</text>
            <g transform={`translate(${pos[0]}, ${pos[1]})`}>
              <rect width={w} height="24" rx="12" fill={T.labelFill} stroke={c} strokeOpacity="0.6" />
              <text x={w / 2} y="16" textAnchor="middle" fontSize="11.5" fontWeight="600" fontFamily="var(--font-sans)" letterSpacing="0.3" fill={T.labelText}>{label}</text>
            </g>
          </motion.g>
        );
      })}
    </svg>
  );
}
