"use client";

import { useEffect, useRef } from "react";
import { markReportRead } from "@/lib/actions";

/** Opening a report is what marks it read — not a button nobody presses. */
export function MarkRead({ id, already }: { id: string; already: boolean }) {
  const fired = useRef(false);
  useEffect(() => {
    if (already || fired.current) return;
    fired.current = true;
    const fd = new FormData();
    fd.set("id", id);
    markReportRead(fd).catch(() => {});
  }, [id, already]);
  return null;
}
