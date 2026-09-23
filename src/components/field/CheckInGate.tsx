"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, DoorOpen, KeyRound, MapPin, Navigation, Radio } from "lucide-react";
import { checkIn, startTravel, type FieldState } from "@/lib/fieldActions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { PhotoInput } from "@/components/field/PhotoInput";
import { where, type Coords } from "@/lib/where";
import { distanceKm, tooFar } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { Pin } from "@/lib/types";

/* The door. Four things have to be true before a checklist exists:
   the owner's code, a location, a photograph of the front door, and —
   if it was booked — the body camera running. None of them is a
   formality: they are the evidence the whole report rests on. */
export function CheckInGate({ id, status, recording, pin }: { id: string; status: string; recording: boolean; pin: Pick<Pin, "lat" | "lng"> | null }) {
  const [state, submit] = useActionState(checkIn, { ok: false } as FieldState);
  const [travel, tellOwner] = useActionState(startTravel, { ok: false } as FieldState);
  const [coords, setCoords] = useState<Coords>({ lat: null, lng: null, accuracy: null });
  const [locating, setLocating] = useState(false);
  const [door, setDoor] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [rolling, setRolling] = useState(!recording);

  const locate = async () => { setLocating(true); setCoords(await where({ precise: true })); setLocating(false); };
  /* Ask once on mount. The state change happens in the promise callback,
     not in the effect body — a synchronous setState here would re-render
     the whole gate before the first paint has landed. */
  useEffect(() => {
    let alive = true;
    where({ precise: true }).then((c) => { if (alive) setCoords(c); });
    return () => { alive = false; };
  }, []);

  /* The same sum the server does, so the inspector knows before they
     press the button whether they will be asked why. */
  const located = coords.lat !== null && coords.lng !== null;
  const distanceM = located && pin ? Math.round(distanceKm({ lat: coords.lat!, lng: coords.lng! }, pin) * 1000) : -1;
  const far = tooFar(distanceM, coords.accuracy);
  const needsReason = !located || far;
  const ready = otp.length === 4 && !!door && located && rolling;

  return (
    <div className="grid gap-4">
      {status === "assigned" && (
        <form action={tellOwner}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="btn-white w-full" pendingLabel="Telling them…">
            <Navigation size={16} /> Tell the owner I am on the way
          </SubmitButton>
          {travel.error && <p className="mt-2 text-[13px] leading-snug text-[#b03434]">{travel.error}</p>}
        </form>
      )}

      <form action={submit} className="card border border-line bg-white p-5 shadow-card">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="lat" value={coords.lat ?? ""} />
        <input type="hidden" name="lng" value={coords.lng ?? ""} />
        <input type="hidden" name="accuracy" value={coords.accuracy ?? ""} />
        <input type="hidden" name="doorPhoto" value={door ?? ""} />

        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">Start the visit</h2>
        <p className="t-small mt-1">The checklist opens once all four are done.</p>

        <ol className="mt-5 grid gap-3">
          {/* 1 — location */}
          <Step n={1} done={coords.lat !== null} title="Your location" I={MapPin}>
            {located ? (
              <div>
                <p className="t-small tabular-nums">
                  {coords.lat!.toFixed(4)}° N, {coords.lng!.toFixed(4)}° E{coords.accuracy !== null && ` · ±${Math.round(coords.accuracy)} m`} — stamped on every photo
                </p>
                <p className={cn("t-small mt-1 font-medium", far ? "text-[#b03434]" : "text-pass")}>
                  {distanceM < 0
                    ? "No pin on this property yet — where you stand now becomes it, and the owner confirms."
                    : far ? `${distanceM} m from the owner's pin. If you are at the right gate, say why below.` : `${distanceM} m from the owner's pin.`}
                </p>
                {far && <button type="button" onClick={locate} className="btn btn-white btn-sm mt-2">{locating ? "Finding you…" : "Read my location again"}</button>}
              </div>
            ) : (
              <div>
                <p className="t-small">{locating ? "Finding you…" : "GPS is off, or the browser refused. Turn it on — every photograph is stamped with it."}</p>
                <button type="button" onClick={locate} className="btn btn-white btn-sm mt-2">Try again</button>
              </div>
            )}
          </Step>

          {/* 2 — body cam */}
          {recording && (
            <Step n={2} done={rolling} title="Body camera" I={Radio}>
              <p className="t-small">This visit was booked with the full-visit recording. Start it before you walk in, and leave it running until you are out.</p>
              <button type="button" onClick={() => setRolling(true)}
                className={cn("btn btn-sm mt-2 w-full", rolling ? "btn-white" : "btn-accent")}>
                {rolling ? <><Check size={14} /> Recording</> : "Start recording"}
              </button>
            </Step>
          )}

          {/* 3 — door photo */}
          <Step n={recording ? 3 : 2} done={!!door} title="Photograph the front door" I={DoorOpen}>
            {door ? (
              <div className="flex items-center gap-3">
                <Image src={door} alt="Front door" width={64} height={64} unoptimized className="h-16 w-16 rounded-[10px] object-cover" />
                <button type="button" onClick={() => setDoor(null)} className="text-[13px] font-medium text-text-2 underline underline-offset-4">Retake</button>
              </div>
            ) : (
              <PhotoInput big label="Take the photo" onPhoto={(thumb) => setDoor(thumb)} />
            )}
          </Step>

          {/* 4 — the owner's code */}
          <Step n={recording ? 4 : 3} done={otp.length === 4} title="The owner's code" I={KeyRound}>
            <p className="t-small mb-2">Ask them to read out the four digits. No code, no checklist.</p>
            <input
              name="otp" inputMode="numeric" maxLength={4} value={otp} placeholder="····"
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-14 w-full rounded-[12px] border border-line-2 bg-white text-center font-mono text-[26px] tracking-[0.5em] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </Step>
        </ol>

        {needsReason && (
          <label className="mt-4 block">
            <span className="t-small">{located ? "Far from the pin? Say why — it goes on the report." : "If GPS will not work here, say why — it goes on the report."}</span>
            <input name="reason" className="mt-1.5 h-11 w-full rounded-[12px] border border-line-2 px-3 text-[14px] outline-none focus:border-accent" placeholder={located ? "The gate is on the service road behind" : "Basement, no signal"} />
          </label>
        )}

        {state.error && (
          <p className="mt-4 flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
          </p>
        )}

        <SubmitButton className="mt-4 w-full" pendingLabel="Opening the checklist…">
          {ready ? "I am in — open the checklist" : "Finish the four steps"}
        </SubmitButton>
      </form>
    </div>
  );
}

function Step({ n, done, title, I, children }: { n: number; done: boolean; title: string; I: typeof MapPin; children: React.ReactNode }) {
  return (
    <li className={cn("rounded-[14px] border p-4 transition", done ? "border-pass/30 bg-pass-soft" : "border-line-2")}>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold", done ? "bg-pass text-white" : "bg-beige text-text-2")}>
          {done ? <Check size={14} strokeWidth={3} /> : n}
        </span>
        <span className="flex items-center gap-1.5 text-[15px] font-semibold"><I size={14} className="text-text-3" /> {title}</span>
      </div>
      <div className="mt-2.5 pl-[38px]">{children}</div>
    </li>
  );
}
