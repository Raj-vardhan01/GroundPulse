"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CheckCircle2, ImageOff, Play, X } from "lucide-react";
import { witnessRepair, type FieldState } from "@/lib/fieldActions";
import { PhotoInput } from "@/components/field/PhotoInput";
import { VideoInput, type Uploaded } from "@/components/field/VideoInput";
import { SubmitButton } from "@/components/app/SubmitButton";

/* Before and after, side by side, the after slot empty until the camera
   fills it. The before-photo lies faintly over the camera so the new one
   is taken from where the old one was — the owner compares the same
   wall, not two views of a room. A photo, a clip, or both. */
export function RepairAfter({ id, before, due, day }: { id: string; before: string | null; due: boolean; day: string }) {
  const [state, submit] = useActionState(witnessRepair, { ok: false } as FieldState);
  const [after, setAfter] = useState<{ thumb: string; lat: number | null; lng: number | null } | null>(null);
  const [clip, setClip] = useState<Uploaded | null>(null);

  if (state.ok) {
    return (
      <div className="card border border-pass/30 bg-pass-soft p-5 text-center">
        <CheckCircle2 size={24} className="mx-auto text-pass" />
        <h2 className="serif mt-3 text-[22px] tracking-[-0.03em]">Repair closed.</h2>
        <p className="t-small mx-auto mt-1 max-w-[36ch]">The owner has the after shot next to the before, and your note.</p>
      </div>
    );
  }

  return (
    <form action={submit} className="card border border-line bg-white p-5 shadow-card">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="afterPhoto" value={after?.thumb ?? ""} />
      <input type="hidden" name="lat" value={after?.lat ?? ""} />
      <input type="hidden" name="lng" value={after?.lng ?? ""} />
      <input type="hidden" name="afterVideo" value={clip ? JSON.stringify(clip) : ""} />

      <h2 className="text-[17px] font-semibold tracking-[-0.015em]">After — same angle</h2>
      <p className="t-small mt-1">Stand where the first photo was taken. It shows faintly over the camera; line the two up, then take it.</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <figure className="grid gap-1.5">
          {before
            ? <Image src={before} alt="Before" width={320} height={240} unoptimized className="aspect-[4/3] w-full rounded-[12px] object-cover" />
            : <span className="grid aspect-[4/3] w-full place-items-center rounded-[12px] bg-beige text-text-3"><ImageOff size={18} /></span>}
          <figcaption className="t-label">Before</figcaption>
        </figure>
        <figure className="grid gap-1.5">
          {after || clip?.poster
            ? <span className="relative">
                <Image src={after?.thumb ?? clip!.poster} alt="After" width={320} height={240} unoptimized className="aspect-[4/3] w-full rounded-[12px] object-cover" />
                {!after && <span className="absolute inset-0 grid place-items-center"><Play size={22} className="fill-white text-white drop-shadow" /></span>}
              </span>
            : <span className="grid aspect-[4/3] w-full place-items-center rounded-[12px] border-2 border-dashed border-line-2 px-3 text-center text-[12.5px] leading-snug text-text-3">
                {due ? "Same angle, after the work" : `Opens on ${day}`}
              </span>}
          <figcaption className="t-label">After</figcaption>
        </figure>
      </div>

      {due ? (
        <>
          <div className="mt-3 grid gap-2">
            <PhotoInput big ghost={before} label={after ? "Retake the after photo" : "Take the after photo"} onPhoto={(thumb, c) => setAfter({ thumb, ...c })} />
            {clip ? (
              <p className="flex items-center justify-between gap-2 rounded-[12px] bg-accent-tint px-3.5 py-2.5 text-[13.5px] text-accent-2">
                After clip uploaded · {clip.durationS}s
                <button type="button" onClick={() => setClip(null)} aria-label="Remove the clip" className="grid h-7 w-7 place-items-center rounded-full"><X size={14} /></button>
              </p>
            ) : (
              <VideoInput big scope="repair" id={id} ghost={before} label="Record an after clip" maxSeconds={30} onVideo={setClip} />
            )}
          </div>
          <label className="mt-4 block">
            <span className="text-[14px] font-semibold">What was done</span>
            <textarea
              name="note" rows={3} required minLength={10}
              placeholder="Replaced the geyser thermostat and the inlet washer. Ran it 20 minutes — no drip."
              className="mt-1.5 w-full rounded-[12px] border border-line-2 bg-white px-3.5 py-2.5 text-[14.5px] leading-snug outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </label>
          {state.error && (
            <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
            </p>
          )}
          <SubmitButton className="mt-4 w-full" pendingLabel="Closing the repair…">Close the repair</SubmitButton>
        </>
      ) : (
        <p className="t-small mt-3 rounded-[12px] bg-paper px-4 py-3">The after shot opens on {day} — the day the owner chose. Be there with the pro.</p>
      )}
    </form>
  );
}
