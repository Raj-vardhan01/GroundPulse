"use client";

import { useMemo, useState } from "react";
import { coverage, extraGroups, tiers, type BhkKey, type Extra, type TierId } from "@/lib/cleaning";

const all = extraGroups.flatMap((g) => g.items);

/** One cleaning order. Lives here so the quote form and the summary
    panel beside it read from a single source instead of two copies. */
export function useCleanOrder(initialSize: BhkKey = "2", initialTier: TierId = "deep") {
  const [size, setSize] = useState<BhkKey>(initialSize);
  const [tierId, setTierId] = useState<TierId>(initialTier);
  const [qty, setQty] = useState<Record<string, number>>({});

  const tier = tiers.find((t) => t.id === tierId)!;
  const base = tier.price[size];
  const cov = coverage[size];

  const picked = useMemo(
    () => all.filter((e) => e.price > 0 && (qty[e.id] || 0) > 0).map((e) => ({ e, n: qty[e.id] })),
    [qty]
  );
  const extrasTotal = picked.reduce((t, p) => t + p.e.price * p.n, 0);

  const bump = (e: Extra, d: number) => {
    const cap = e.max ?? 1;
    setQty((s) => ({ ...s, [e.id]: Math.max(0, Math.min(cap, (s[e.id] || 0) + d)) }));
  };
  const toggle = (e: Extra) => setQty((s) => ({ ...s, [e.id]: s[e.id] ? 0 : 1 }));

  return { size, setSize, tierId, setTierId, qty, bump, toggle, tier, base, cov, picked, extrasTotal, total: base + extrasTotal };
}

export type CleanOrder = ReturnType<typeof useCleanOrder>;
