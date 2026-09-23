"use client";

import { useActionState, useState } from "react";
import { Check, ExternalLink, MapPin, MapPinOff, Move, X } from "lucide-react";
import { confirmPropertyPin, setPropertyPin, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { PinPicker, type PinValue } from "@/components/app/PinPicker";
import { fmtDate } from "@/lib/format";
import type { MapConfig } from "@/lib/ola";
import type { Pin } from "@/lib/types";

const asDraft = (pin: Pin | null): PinValue | null =>
  pin ? { lat: pin.lat, lng: pin.lng, accuracyM: pin.accuracyM, source: pin.source === "gps" ? "gps" : "map" } : null;

/* Where the property is, on its own page. Showing it costs nothing — no
   map is drawn until somebody chooses to move the pin. The one state that
   asks for attention is a pin the first inspector marked at the gate:
   every visit is measured from it, so the owner has to agree with it. */
export function PinPanel({ id, plot, pin, map }: { id: string; plot: boolean; pin: Pin | null; map: MapConfig }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PinValue | null>(asDraft(pin));
  const [state, submit] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await setPropertyPin(prev, fd);
    if (r.ok) setEditing(false);
    return r;
  }, { ok: false } as FormState);
  const unconfirmed = pin?.source === "inspector" && !pin.confirmedAt;
  /* Always start from the saved pin, not from a move that was cancelled. */
  const edit = () => { setDraft(asDraft(pin)); setEditing(true); };

  if (editing) {
    return (
      <form action={submit} className="grid gap-3 px-5 py-4">
        <input type="hidden" name="id" value={id} />
        <PinPicker value={draft} onChange={setDraft} config={map} plot={plot} startOpen />
        <div className="flex gap-2">
          <SubmitButton className="btn-sm" pendingLabel="Saving…"><Check size={14} /> Save the pin</SubmitButton>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-white btn-sm"><X size={14} /> Cancel</button>
        </div>
        {state.error && <p className="text-[13px] text-[#b03434]">{state.error}</p>}
      </form>
    );
  }

  if (!pin) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-beige text-text-2"><MapPinOff size={16} /></span>
          <p className="t-small leading-relaxed">
            {plot
              ? "No pin yet. A plot has no door number, so the pin is how an inspector finds it — and what every visit is measured from."
              : "No pin yet. Your first inspector will mark it at the gate and ask you to confirm — or mark it yourself now."}
          </p>
        </div>
        <button type="button" onClick={edit} className="btn btn-accent btn-sm mt-4"><MapPin size={14} /> Add the pin</button>
      </div>
    );
  }

  const google = `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
  const who = pin.source === "inspector"
    ? `Marked by your inspector at the gate, ${fmtDate(pin.at)}${pin.confirmedAt ? ` · confirmed by you ${fmtDate(pin.confirmedAt)}` : ""}`
    : pin.source === "gps" ? `Marked with your phone at the property, ${fmtDate(pin.at)}` : `Marked by you on the map, ${fmtDate(pin.at)}`;

  return (
    <div className="px-5 py-4">
      {unconfirmed && (
        <div className="mb-4 rounded-[12px] border border-warn/25 bg-warn-soft p-3.5 text-[13.5px] leading-snug text-[#94560a]">
          Your inspector marked this spot at the gate. Is it right? Every visit from now on is measured from it.
        </div>
      )}
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><MapPin size={16} /></span>
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium tabular-nums">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}{pin.accuracyM !== null && <span className="font-normal text-text-3"> · ±{pin.accuracyM} m</span>}</div>
          <div className="t-small mt-0.5">{who}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {unconfirmed && (
          <form action={confirmPropertyPin}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton className="btn-sm" pendingLabel="Saving…"><Check size={14} /> Yes, that is it</SubmitButton>
          </form>
        )}
        <button type="button" onClick={edit} className="btn btn-white btn-sm"><Move size={14} /> {unconfirmed ? "No, move it" : "Move the pin"}</button>
        <a href={google} target="_blank" rel="noopener" className="btn btn-pill btn-sm"><ExternalLink size={13} /> See it on Google Maps</a>
      </div>
      {state.ok && <p className="mt-3 text-[13px] text-pass">Pin saved.</p>}
    </div>
  );
}
