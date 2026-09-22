"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** Shrink a camera photo to something a checklist can carry.

    The full-resolution file is what an owner eventually looks at, and in
    production it goes straight to object storage. What travels with the
    checklist is this: 320px on the long edge, JPEG, around 12 KB — small
    enough to survive a two-bar connection at a gate, and big enough that
    the thumbnail in the report is a real photograph of a real room. */
async function shrink(file: File, max = 320): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function PhotoInput({
  onPhoto, label = "Photo", className, big = false,
}: {
  onPhoto: (thumb: string, coords: { lat: number | null; lng: number | null }) => void;
  label?: string;
  className?: string;
  big?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function take(file: File) {
    setBusy(true);
    try {
      const [thumb, coords] = await Promise.all([shrink(file), where()]);
      onPhoto(thumb, coords);
    } catch {
      /* A camera that refuses is not worth a dialog — the button simply
         does nothing and they can try again. */
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) take(f); }}
      />
      <button
        type="button" onClick={() => ref.current?.click()} disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[12px] border border-line-2 bg-white font-medium text-text-2 transition active:translate-y-px disabled:opacity-60",
          big ? "h-12 w-full text-[14.5px]" : "h-9 px-3 text-[12.5px]",
          className,
        )}
      >
        {busy ? <Loader2 size={big ? 16 : 13} className="animate-spin" /> : <Camera size={big ? 16 : 13} />}
        {busy ? "Saving…" : label}
      </button>
    </>
  );
}

/** Best-effort coordinates. Every photograph carries where it was taken;
    if the phone will not say, we record that honestly rather than guess. */
export function where(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    const done = (v: { lat: number | null; lng: number | null }) => resolve(v);
    navigator.geolocation.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => done({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  });
}
