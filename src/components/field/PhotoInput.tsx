"use client";

import { useState } from "react";
import { Camera as CameraIcon, Loader2 } from "lucide-react";
import { Camera } from "@/components/field/Camera";
import { cn } from "@/lib/cn";
import { where } from "@/lib/where";

/** The button every inspector photograph starts from. It opens the live
    camera — never a file picker — and stamps where the phone was when
    the frame was taken. */
export function PhotoInput({
  onPhoto, label = "Photo", className, big = false, ghost,
}: {
  onPhoto: (thumb: string, coords: { lat: number | null; lng: number | null }) => void;
  label?: string;
  className?: string;
  big?: boolean;
  /** an earlier photo to line this one up with, shown faintly over the camera */
  ghost?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function shot(thumb: string) {
    setBusy(true);
    try {
      onPhoto(thumb, await where());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button" onClick={() => setOpen(true)} disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[12px] border border-line-2 bg-white font-medium text-text-2 transition active:translate-y-px disabled:opacity-60",
          big ? "h-12 w-full text-[14.5px]" : "h-9 px-3 text-[12.5px]",
          className,
        )}
      >
        {busy ? <Loader2 size={big ? 16 : 13} className="animate-spin" /> : <CameraIcon size={big ? 16 : 13} />}
        {busy ? "Saving…" : label}
      </button>
      <Camera open={open} onClose={() => setOpen(false)} onShot={shot} ghost={ghost} title={label} />
    </>
  );
}
