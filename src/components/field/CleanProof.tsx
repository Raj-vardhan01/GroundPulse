"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, Play, RefreshCw, Sparkles } from "lucide-react";
import { startCrew, type FieldState } from "@/lib/fieldActions";
import { PhotoInput } from "@/components/field/PhotoInput";
import { SubmitButton } from "@/components/app/SubmitButton";
import { cn } from "@/lib/cn";
import type { DraftRoom, Photo } from "@/lib/types";

/** The clean booked on this visit, as the page worked it out — times are
    already in IST words, so the phone's own clock never decides them. */
export type CleanInfo = {
  name: string;
  hours: string;
  crew: string;
  /** "10:12" once the crew has started */
  started: string | null;
  /** "11:12" — when the after photos open */
  opensAt: string | null;
  open: boolean;
};

type Shot = (room: string, which: "before" | "after", thumb: string, c: { lat: number | null; lng: number | null }) => Promise<string | null>;

/* Every room the crew cleans, photographed from one spot before they
   start and from the same spot after they finish — the before photo
   lies faintly over the camera for the after one. The inspector cannot
   let the crew start with a room unphotographed, and cannot take the
   after photos until the crew has had time to do the job. */
export function CleanProof({ id, clean, rooms, onShot }: { id: string; clean: CleanInfo; rooms: DraftRoom[]; onShot: Shot }) {
  const router = useRouter();
  const [state, start] = useActionState(startCrew, { ok: false } as FieldState);
  const [error, setError] = useState<string | null>(null);

  const befores = rooms.filter((r) => r.before).length;
  const afters = rooms.filter((r) => r.after).length;
  const started = !!clean.started;
  const done = started && afters === rooms.length;

  const shoot = (room: string, which: "before" | "after") => async (thumb: string, c: { lat: number | null; lng: number | null }) =>
    setError(await onShot(room, which, thumb, c));

  const [title, body] = !started
    ? ["Before the crew starts", `Photograph every room from its doorway — ${befores} of ${rooms.length} done. The after photo is lined up with it.`]
    : !clean.open
      ? [`Crew working since ${clean.started}`, `After photos open at ${clean.opensAt}. Stay with them, and walk the checklist meanwhile.`]
      : done
        ? ["Clean photographed", "Before and after of every room go into the report, side by side."]
        : ["After — from the same spot", `${afters} of ${rooms.length} done. Check each room is actually clean first; the before photo shows faintly on the camera.`];

  return (
    <section className={cn("card border bg-white shadow-card", done ? "border-pass/30" : "border-accent/25")}>
      <div className="px-4 py-3.5">
        <div className="t-label flex items-center gap-1.5"><Sparkles size={12} /> {clean.name} · {clean.hours} · {clean.crew}</div>
        <h3 className="mt-1 text-[15.5px] font-semibold">{title}</h3>
        <p className="t-small mt-0.5 leading-snug">{body}</p>
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {rooms.map((r) => (
          <li key={r.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Thumb photo={r.before ?? null} label="Before" />
            <Thumb photo={r.after ?? null} label="After" />
            <span className="grow basis-[7rem] text-[14px] font-medium">{r.name}</span>
            {!started && <PhotoInput label={r.before ? "Retake" : "Before"} onPhoto={shoot(r.name, "before")} />}
            {started && clean.open && (
              <PhotoInput label={r.after ? "Retake" : "After"} ghost={r.before?.thumb ?? null} onPhoto={shoot(r.name, "after")} />
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-line bg-paper px-4 py-3.5">
        {!started ? (
          <form action={start}>
            <input type="hidden" name="id" value={id} />
            {befores === rooms.length
              ? <SubmitButton className="w-full" pendingLabel="Starting…"><Play size={15} /> The crew can start</SubmitButton>
              : <button type="button" disabled className="btn btn-accent w-full opacity-50">{rooms.length - befores} before photo{rooms.length - befores === 1 ? "" : "s"} to go</button>}
          </form>
        ) : !clean.open ? (
          <div className="flex flex-wrap items-center gap-3">
            <Clock size={15} className="shrink-0 text-text-3" />
            <span className="t-small grow basis-[12rem]">The camera keeps rolling. After photos open at {clean.opensAt}.</span>
            <button type="button" onClick={() => router.refresh()} className="btn btn-white btn-sm shrink-0"><RefreshCw size={13} /> Check again</button>
          </div>
        ) : (
          <p className="t-small">{done ? "Nothing left here — finish the checklist and submit." : "The visit cannot be submitted until every room has its after photo."}</p>
        )}
        {(error || state.error) && (
          <p className="mt-2.5 flex items-start gap-2 rounded-[10px] bg-fail-soft px-3 py-2 text-[13px] leading-snug text-[#b03434]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error || state.error}
          </p>
        )}
      </div>
    </section>
  );
}

function Thumb({ photo, label }: { photo: Photo | null; label: string }) {
  return photo
    ? <Image src={photo.thumb} alt={label} width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-[8px] object-cover" />
    : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] border border-dashed border-line-2 text-[10px] font-medium text-text-3">{label}</span>;
}
