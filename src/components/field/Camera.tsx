"use client";

import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ════════════════════════════════════════════════════════════════
   The only way a photograph or a clip gets into an inspection: the
   camera, live, now.

   A file picker — even one that asks for the camera — can be turned
   into "choose from gallery", and a report is only worth the promise
   that its pictures were taken at that door on that day. So there is no
   picker. The page opens the camera stream itself and keeps the frame it
   is showing, or records what it is showing: there is nothing on the
   phone to choose.

   `ghost` lays an earlier photograph faintly over the live view, so the
   after-photo or after-clip of a repair is taken from the same spot as
   the before.
   ════════════════════════════════════════════════════════════════ */

/** 320px on the long edge, JPEG — what a checklist can carry over two
    bars at a gate, and still a real photograph of a real room. */
const MAX_EDGE = 320;

function toJpeg(source: CanvasImageSource, w: number, h: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

/** A recorded clip, before it is uploaded. */
export type Clip = { blob: Blob; mime: string; durationS: number; poster: string };

/* MP4 first: it plays on every phone an owner might hold. WebM where the
   browser cannot record anything else. */
const MIMES = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
const pickMime = () =>
  typeof MediaRecorder === "undefined" ? "" : MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

/* About 11 MB a minute — clear enough to read a meter, small enough to
   upload from a gate. */
const VIDEO_BPS = 1_400_000;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type Status = "starting" | "live" | "denied" | "unsupported";

export function Camera({ open, onClose, onShot, onClip, mode = "photo", maxSeconds = 90, ghost, title = "Take the photo" }: {
  open: boolean;
  onClose: () => void;
  onShot?: (jpeg: string) => void;
  onClip?: (clip: Clip) => void;
  mode?: "photo" | "video";
  /** a clip stops itself here */
  maxSeconds?: number;
  /** an earlier photo to line the new one up with */
  ghost?: string | null;
  title?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [started, setStatus] = useState<Exclude<Status, "unsupported">>("starting");
  const [ghostOn, setGhostOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  /* Only a secure page gets a camera: production and localhost do; a
     phone on the dev server's plain-http LAN address does not. A clip
     also needs the browser to be able to record. */
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && (mode === "photo" || !!pickMime());
  const status: Status = supported ? started : "unsupported";

  useEffect(() => {
    if (!open || !supported) return;
    let gone = false;
    const start = async () => {
      const video720 = { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } };
      const photoRes = { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      try {
        let s: MediaStream;
        if (mode === "video") {
          /* The inspector's voice helps ("this is the damp patch"); if the
             microphone is refused, the clip is still worth having. */
          s = await navigator.mediaDevices.getUserMedia({ video: video720, audio: true })
            .catch(() => navigator.mediaDevices.getUserMedia({ video: video720, audio: false }));
        } else {
          s = await navigator.mediaDevices.getUserMedia({ video: photoRes, audio: false });
        }
        if (gone) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        setStatus("live");
      } catch {
        if (!gone) setStatus("denied");
      }
    };
    start();
    return () => {
      gone = true;
      if (recorder.current && recorder.current.state !== "inactive") {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      recorder.current = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [open, supported, mode]);

  /* the clock, and the hard stop at the limit */
  useEffect(() => {
    if (!recording) return;
    const began = Date.now();
    const t = setInterval(() => {
      const s = (Date.now() - began) / 1000;
      setElapsed(s);
      if (s >= maxSeconds && recorder.current?.state === "recording") recorder.current.stop();
    }, 250);
    return () => clearInterval(t);
  }, [recording, maxSeconds]);

  const close = () => { setStatus("starting"); setRecording(false); setElapsed(0); onClose(); };

  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    onShot?.(toJpeg(v, v.videoWidth, v.videoHeight));
    close();
  };

  const record = () => {
    const v = video.current, s = stream.current;
    if (!v || !s || !v.videoWidth) return;
    const mime = pickMime();
    const poster = toJpeg(v, v.videoWidth, v.videoHeight);
    const chunks: Blob[] = [];
    const began = Date.now();
    const r = new MediaRecorder(s, { mimeType: mime, videoBitsPerSecond: VIDEO_BPS, audioBitsPerSecond: 64_000 });
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      const durationS = Math.max(1, Math.round((Date.now() - began) / 1000));
      onClip?.({ blob: new Blob(chunks, { type: r.mimeType || mime }), mime: r.mimeType || mime, durationS, poster });
      close();
    };
    recorder.current = r;
    r.start(1000);
    setElapsed(0);
    setRecording(true);
  };

  const stop = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };

  /* Development only: a laptop may have no camera to point at anything.
     Production never renders this. */
  const devFile = async (file: File) => {
    if (mode === "photo") {
      const bitmap = await createImageBitmap(file);
      onShot?.(toJpeg(bitmap, bitmap.width, bitmap.height));
      bitmap.close();
      return close();
    }
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.muted = true;
    el.src = url;
    await new Promise((ok) => { el.onloadeddata = ok; el.onerror = ok; });
    const poster = el.videoWidth ? toJpeg(el, el.videoWidth, el.videoHeight) : "";
    onClip?.({ blob: file, mime: file.type || "video/mp4", durationS: Math.max(1, Math.round(el.duration || 1)), poster });
    URL.revokeObjectURL(url);
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black text-white" role="dialog" aria-label={title}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))]">
        <span className="grow text-[15px] font-semibold">{title}</span>
        {ghost && status === "live" && (
          <button type="button" onClick={() => setGhostOn((g) => !g)} className="rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-medium">
            {ghostOn ? "Hide the first photo" : "Show the first photo"}
          </button>
        )}
        <button type="button" onClick={close} aria-label="Close the camera" className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><X size={18} /></button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={video} playsInline muted autoPlay className="h-full w-full object-cover" />
        {ghost && ghostOn && status === "live" && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={ghost} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        {ghost && status === "live" && !recording && (
          <p className="pointer-events-none absolute inset-x-4 top-3 rounded-[10px] bg-black/55 px-3 py-2 text-center text-[13px] leading-snug">
            Stand where the first photo was taken and line it up with the faint picture.
          </p>
        )}
        {recording && (
          <span className="absolute left-1/2 top-3 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 font-mono text-[13px] tabular-nums">
            <span className="h-2 w-2 rounded-full bg-fail" /> {fmt(elapsed)} / {fmt(maxSeconds)}
          </span>
        )}
        {status !== "live" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            {status === "starting" ? (
              <Loader2 size={24} className="animate-spin text-white/70" />
            ) : (
              <div className="grid max-w-[34ch] gap-3">
                <p className="text-[15px] font-semibold">
                  {status === "unsupported" ? (mode === "video" ? "This browser cannot record video here." : "This page cannot open the camera here.") : "The camera is blocked."}
                </p>
                <p className="text-[13.5px] leading-snug text-white/70">
                  {status === "unsupported"
                    ? "The camera only works on the secure app (https), in an up-to-date Chrome or Safari. Open stillyours.in on this phone."
                    : "Allow the camera for this site in your browser settings, then try again. Nothing can come from the gallery."}
                </p>
                {process.env.NODE_ENV === "development" && (
                  <label className="mx-auto mt-2 cursor-pointer rounded-full border border-white/30 px-3 py-1.5 text-[12px] text-white/70">
                    Dev only: use a file
                    <input type="file" accept={mode === "video" ? "video/*" : "image/*"} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) devFile(f); }} />
                  </label>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-5">
        {mode === "photo" ? (
          <button type="button" onClick={shoot} disabled={status !== "live"} aria-label="Take the photo"
            className={cn("grid h-[72px] w-[72px] place-items-center rounded-full border-4 border-white transition active:scale-95", status === "live" ? "bg-white/20" : "opacity-40")}>
            <CameraIcon size={26} />
          </button>
        ) : (
          <button type="button" onClick={recording ? stop : record} disabled={status !== "live"} aria-label={recording ? "Stop recording" : "Start recording"}
            className={cn("grid h-[72px] w-[72px] place-items-center rounded-full border-4 border-white transition active:scale-95", status !== "live" && "opacity-40")}>
            {recording ? <Square size={24} className="fill-fail text-fail" /> : <span className="h-12 w-12 rounded-full bg-fail" />}
          </button>
        )}
      </div>
    </div>
  );
}
