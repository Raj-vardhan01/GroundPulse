"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-read the page every few seconds while something live is happening —
    a decision the other side is waiting on. */
export function AutoRefresh({ every = 15 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every * 1000);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
