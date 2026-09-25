"use client";

import { useEffect, useState } from "react";

/** "42:10 left" until a deadline, ticking. Shows "time's up" after. */
export function Countdown({ until, className }: { until: string; className?: string }) {
  const end = Date.parse(until);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    const t = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [end]);
  if (left === null) return <span className={className}>…</span>;
  if (left === 0) return <span className={className}>time&apos;s up</span>;
  const m = Math.floor(left / 60_000);
  const sec = Math.floor((left % 60_000) / 1000);
  return <span className={className} aria-live="off">{m}:{String(sec).padStart(2, "0")} left</span>;
}
