"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Video as VideoIcon, X } from "lucide-react";
import { Camera, type Clip } from "@/components/field/Camera";
import { cn } from "@/lib/cn";
import { where } from "@/lib/where";

/** What the page hands its server action once the file is in storage —
    the server checks the key and the file before it believes any of it. */
export type Uploaded = { id: string; key: string; mime: string; durationS: number; poster: string; lat: number | null; lng: number | null };

/** PUT with progress — fetch cannot report upload progress yet. */
function put(url: string, blob: Blob, mime: string, onProgress: (pct: number) => void) {
  return new Promise<void>((ok, fail) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("content-type", mime);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? ok() : fail(new Error("The upload was refused.")));
    x.onerror = () => fail(new Error("The connection dropped."));
    x.send(blob);
  });
}

/* Record a clip on the live camera and put it in storage. A failed
   upload keeps the clip in memory, so a weak signal at a gate costs a
   retry, not a re-shoot. */
export function VideoInput({
  scope, id, onVideo, label = "Record video", maxSeconds = 30, big = false, ghost, className,
}: {
  scope: "visit" | "repair";
  /** the visit or repair the clip belongs to */
  id: string;
  onVideo: (v: Uploaded) => void;
  label?: string;
  maxSeconds?: number;
  big?: boolean;
  ghost?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState<{ clip: Clip; lat: number | null; lng: number | null } | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* leaving mid-upload loses the clip */
  useEffect(() => {
    if (pct === null) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pct]);

  const upload = async (h: NonNullable<typeof held>) => {
    setError("");
    setPct(0);
    try {
      const res = await fetch("/api/media/sign", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope, id, mime: h.clip.mime, size: h.clip.blob.size }),
      });
      const j = (await res.json().catch(() => ({}))) as { key?: string; url?: string; error?: string };
      if (!res.ok || !j.key || !j.url) throw new Error(j.error || "Could not start the upload.");
      await put(j.url, h.clip.blob, h.clip.mime, setPct);
      onVideo({ id: j.key.split("/")[2].split(".")[0], key: j.key, mime: h.clip.mime, durationS: h.clip.durationS, poster: h.clip.poster, lat: h.lat, lng: h.lng });
      setHeld(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload failed.");
    } finally {
      setPct(null);
    }
  };

  const recorded = async (clip: Clip) => {
    const c = await where();
    const h = { clip, lat: c.lat, lng: c.lng };
    setHeld(h);
    upload(h);
  };

  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-[12px] border border-line-2 bg-white font-medium text-text-2 transition active:translate-y-px disabled:opacity-60",
    big ? "h-12 w-full text-[14.5px]" : "h-9 px-3 text-[12.5px]",
    className,
  );
  const icon = big ? 16 : 13;

  return (
    <>
      {pct !== null ? (
        <span className={cn(base, "relative overflow-hidden")} aria-live="polite">
          <span className="absolute inset-y-0 left-0 bg-accent-tint transition-[width]" style={{ width: `${pct}%` }} />
          <Loader2 size={icon} className="relative animate-spin" /> <span className="relative tabular-nums">Uploading {pct}%</span>
        </span>
      ) : held && error ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => upload(held)} className={cn(base, "border-warn/40 text-[#94560a]")}>
            <RotateCcw size={icon} /> Upload failed — retry
          </button>
          <button type="button" onClick={() => { setHeld(null); setError(""); }} aria-label="Discard the clip" className="grid h-9 w-9 place-items-center rounded-full text-text-3"><X size={14} /></button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={base}>
          <VideoIcon size={icon} /> {label}
        </button>
      )}
      <Camera open={open} onClose={() => setOpen(false)} onClip={recorded} mode="video" maxSeconds={maxSeconds} ghost={ghost} title={label} />
    </>
  );
}
