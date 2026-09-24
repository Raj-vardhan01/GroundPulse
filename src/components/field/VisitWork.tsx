"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertTriangle, Check, ChevronDown, Flag, Play, Send, Video, X, Wrench,
} from "lucide-react";
import { addItemVideo, addPhoto, dropItemVideo, dropPhoto, setCleanPhoto, setItem, setNote, setQuote, setRoomVideo, submitVisit, type FieldState } from "@/lib/fieldActions";
import { FEE_RATE } from "@/lib/repair";
import { carePlusCover } from "@/lib/pricing";
import { PhotoInput } from "@/components/field/PhotoInput";
import { VideoInput, type Uploaded } from "@/components/field/VideoInput";
import { CleanProof, type CleanInfo } from "@/components/field/CleanProof";
import { SubmitButton } from "@/components/app/SubmitButton";
import { outstanding } from "@/lib/checklist";
import { cn } from "@/lib/cn";
import type { DraftItem, DraftQuote, DraftRoom, ItemState, Video as Clip } from "@/lib/types";

/* The checklist, on a phone, in a house with one bar of signal.

   Every tap writes to the server, but the screen never waits for it —
   local state is what renders, and the action follows behind. An
   inspector marking forty items cannot feel a round trip on each one. */

/** A room walkthrough stops itself here; a clip of one problem, sooner. */
const ROOM_SECONDS = 90;
const ITEM_SECONDS = 30;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
/** What the screen shows the moment an upload lands; the server keeps its own checked copy. */
const asClip = (u: Uploaded): Clip => ({ ...u, sizeBytes: 0, at: new Date().toISOString() });

const VERDICTS: { s: ItemState; label: string; cls: string }[] = [
  { s: "pass", label: "OK", cls: "bg-pass text-white" },
  { s: "attn", label: "Attention", cls: "bg-warn text-white" },
  { s: "fail", label: "Fail", cls: "bg-fail text-white" },
];

export function VisitWork({ id, draft: initial, clean = null }: { id: string; draft: DraftRoom[]; clean?: CleanInfo | null }) {
  const [draft, setDraft] = useState<DraftRoom[]>(initial);
  const [open, setOpen] = useState<string | null>(initial.find((r) => r.items.some((i) => i.s === null))?.name ?? initial[0]?.name ?? null);
  const [review, setReview] = useState(false);
  const [, start] = useTransition();

  const send = (action: (fd: FormData) => Promise<unknown>, fields: Record<string, string>) => {
    const fd = new FormData();
    fd.set("id", id);
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    start(() => { action(fd).catch(() => {}); });
  };

  const edit = (room: string, item: string, fn: (i: DraftItem) => DraftItem) =>
    setDraft((d) => d.map((r) => (r.name !== room ? r : { ...r, items: r.items.map((i) => (i.t !== item ? i : fn(i))) })));

  const verdict = (room: string, item: string, s: ItemState) => {
    edit(room, item, (i) => ({ ...i, s }));
    send(setItem, { room, item, state: s });
  };
  const note = (room: string, item: string, value: string) => {
    edit(room, item, (i) => ({ ...i, note: value }));
    send(setNote, { room, item, note: value });
  };
  const priceIt = (room: string, item: string, q: Required<DraftQuote>) => {
    edit(room, item, (i) => ({ ...i, quote: q.service && q.price > 0 ? q : null }));
    send(setQuote, { room, item, service: q.service, price: String(q.price), parts: String(q.parts), excluded: q.excluded ? "1" : "" });
  };
  const photo = (room: string, item: string, thumb: string, c: { lat: number | null; lng: number | null }) => {
    /* the same id on both sides, so removing it a second later removes it on the server too */
    const photoId = crypto.randomUUID();
    edit(room, item, (i) => ({ ...i, photos: [...i.photos, { id: photoId, thumb, at: new Date().toISOString(), lat: c.lat, lng: c.lng }] }));
    send(addPhoto, { room, item, thumb, photoId, lat: String(c.lat ?? ""), lng: String(c.lng ?? "") });
  };
  const removePhoto = (room: string, item: string, photoId: string) => {
    edit(room, item, (i) => ({ ...i, photos: i.photos.filter((p) => p.id !== photoId) }));
    send(dropPhoto, { room, item, photoId });
  };
  const roomVideo = (room: string, u: Uploaded) => {
    setDraft((d) => d.map((r) => (r.name === room ? { ...r, video: asClip(u) } : r)));
    send(setRoomVideo, { room, video: JSON.stringify(u) });
  };
  const itemVideo = (room: string, item: string, u: Uploaded) => {
    edit(room, item, (i) => ({ ...i, videos: [...i.videos, asClip(u)] }));
    send(addItemVideo, { room, item, video: JSON.stringify(u) });
  };
  const removeVideo = (room: string, item: string, key: string) => {
    edit(room, item, (i) => ({ ...i, videos: i.videos.filter((v) => v.key !== key) }));
    send(dropItemVideo, { room, item, key });
  };
  /* The clean's photos wait for the server: it may say "not yet", and a
     photo it refused must not sit on the screen looking saved. */
  const cleanShot = async (room: string, which: "before" | "after", thumb: string, c: { lat: number | null; lng: number | null }) => {
    const photoId = crypto.randomUUID();
    const was = draft.find((r) => r.name === room)?.[which] ?? null;
    const put = (p: DraftRoom["before"]) => setDraft((d) => d.map((r) => (r.name === room ? { ...r, [which]: p } : r)));
    put({ id: photoId, thumb, at: new Date().toISOString(), lat: c.lat, lng: c.lng });
    const fd = new FormData();
    for (const [k, v] of Object.entries({ id, room, which, thumb, photoId, lat: String(c.lat ?? ""), lng: String(c.lng ?? "") })) fd.set(k, v);
    const res = await setCleanPhoto(fd).catch(() => ({ ok: false, error: "No signal — that photo did not save. Take it again." }));
    if (res.ok) return null;
    put(was);
    return res.error ?? "That photo did not save.";
  };
  const cleanedRooms = draft.filter((r) => r.before !== undefined);

  const total = draft.reduce((n, r) => n + r.items.length, 0);
  const answered = draft.reduce((n, r) => n + r.items.filter((i) => i.s !== null).length, 0);
  const flagged = draft.reduce((n, r) => n + r.items.filter((i) => i.s && i.s !== "pass").length, 0);
  const todo = useMemo(() => outstanding(draft), [draft]);

  if (review) return <Review id={id} draft={draft} todo={todo} back={() => setReview(false)} onJump={(room) => { setOpen(room); setReview(false); }} />;

  return (
    <div className="grid gap-3">
      {/* progress — pinned, because it is the only thing they keep checking */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-baseline justify-between text-[13.5px]">
          <span className="font-semibold">{answered} of {total} answered</span>
          <span className={cn("tabular-nums", flagged ? "text-fail" : "text-text-3")}>{flagged} flagged</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-beige-2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      {clean && cleanedRooms.length > 0 && <CleanProof id={id} clean={clean} rooms={cleanedRooms} onShot={cleanShot} />}

      {draft.map((room) => {
        const done = room.items.filter((i) => i.s !== null).length;
        const complete = done === room.items.length && !!room.video;
        const isOpen = open === room.name;
        return (
          <section key={room.name} className={cn("card border bg-white shadow-card", complete ? "border-pass/30" : "border-line")}>
            <button type="button" onClick={() => setOpen(isOpen ? null : room.name)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums",
                complete ? "bg-pass text-white" : done ? "bg-accent-tint text-accent" : "bg-beige text-text-2")}>
                {complete ? <Check size={15} strokeWidth={3} /> : `${done}/${room.items.length}`}
              </span>
              <span className="grow basis-[8rem]">
                <span className="block text-[15.5px] font-semibold">{room.name}</span>
                <span className="t-small block">{done === room.items.length ? "all answered" : `${room.items.length - done} to go`} · {room.video ? "video done" : "video missing"}</span>
              </span>
              <ChevronDown size={18} className={cn("shrink-0 text-text-3 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
              <div className="border-t border-line">
                {room.items.map((item) => (
                  <Item
                    key={item.t} item={item} visitId={id}
                    onVerdict={(s) => verdict(room.name, item.t, s)}
                    onNote={(v) => note(room.name, item.t, v)}
                    onQuote={(q) => priceIt(room.name, item.t, q)}
                    onPhoto={(t, c) => photo(room.name, item.t, t, c)}
                    onDrop={(pid) => removePhoto(room.name, item.t, pid)}
                    onVideo={(u) => itemVideo(room.name, item.t, u)}
                    onDropVideo={(key) => removeVideo(room.name, item.t, key)}
                  />
                ))}
                {/* the room's walkthrough — the visit cannot be submitted without one */}
                <div className="border-t border-line bg-paper px-4 py-3.5">
                  {room.video ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {room.video.poster
                        ? <Image src={room.video.poster} alt="" width={80} height={56} unoptimized className="h-14 w-20 shrink-0 rounded-[8px] object-cover" />
                        : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-[8px] bg-beige text-text-3"><Video size={16} /></span>}
                      <span className="grow basis-[8rem]">
                        <span className="block text-[13.5px] font-medium">Room video · {fmt(room.video.durationS)}</span>
                        <span className="t-small block">Uploaded and stamped</span>
                      </span>
                      <VideoInput scope="visit" id={id} label="Re-record" maxSeconds={ROOM_SECONDS} onVideo={(u) => roomVideo(room.name, u)} />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <p className="flex items-center gap-2 text-[13.5px] text-text-2"><Video size={15} className="shrink-0 text-text-3" /> Walk this room end to end on video — up to a minute and a half.</p>
                      <VideoInput big scope="visit" id={id} label="Record the room" maxSeconds={ROOM_SECONDS} onVideo={(u) => roomVideo(room.name, u)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20">
        <button type="button" onClick={() => setReview(true)} className="btn btn-accent w-full shadow-float">
          Review and submit {todo.length > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px]">{todo.length} left</span>}
        </button>
      </div>
    </div>
  );
}

function Item({
  item, visitId, onVerdict, onNote, onQuote, onPhoto, onDrop, onVideo, onDropVideo,
}: {
  item: DraftItem;
  visitId: string;
  onVerdict: (s: ItemState) => void;
  onNote: (v: string) => void;
  onQuote: (q: Required<DraftQuote>) => void;
  onPhoto: (thumb: string, c: { lat: number | null; lng: number | null }) => void;
  onDrop: (photoId: string) => void;
  onVideo: (u: Uploaded) => void;
  onDropVideo: (key: string) => void;
}) {
  const needsProof = item.s === "attn" || item.s === "fail";
  return (
    <div className="border-b border-line px-4 py-3.5 last:border-0">
      <div className="text-[14.5px] font-medium">{item.t}</div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {VERDICTS.map((v) => (
          <button key={v.s} type="button" onClick={() => onVerdict(v.s)}
            className={cn("h-11 rounded-[10px] text-[13px] font-semibold transition active:translate-y-px",
              item.s === v.s ? v.cls : "border border-line-2 text-text-2")}>
            {v.label}
          </button>
        ))}
      </div>

      {needsProof && (
        <div className="mt-3 rounded-[12px] bg-paper p-3">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-2">
            <Flag size={12} className={item.s === "fail" ? "text-fail" : "text-warn"} />
            A flag needs a photo or a video, and a line about it — the owner decides from this.
          </p>
          <textarea
            defaultValue={item.note} onBlur={(e) => onNote(e.target.value)} rows={2}
            placeholder="What you saw, in plain words."
            className="mt-2 w-full rounded-[10px] border border-line-2 bg-white px-3 py-2 text-[14px] leading-snug outline-none focus:border-accent"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.photos.map((p) => (
              <span key={p.id} className="relative">
                <Image src={p.thumb} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-[8px] object-cover" />
                <button type="button" onClick={() => onDrop(p.id)} aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white">
                  <X size={11} />
                </button>
              </span>
            ))}
            {item.videos.map((v) => (
              <span key={v.key} className="relative">
                {v.poster
                  ? <Image src={v.poster} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-[8px] object-cover" />
                  : <span className="grid h-14 w-14 place-items-center rounded-[8px] bg-beige" />}
                <span className="absolute inset-0 grid place-items-center"><Play size={16} className="fill-white text-white drop-shadow" /></span>
                <button type="button" onClick={() => onDropVideo(v.key)} aria-label="Remove video"
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-white">
                  <X size={11} />
                </button>
              </span>
            ))}
            <PhotoInput onPhoto={onPhoto} label={item.photos.length ? "Another photo" : "Add photo"} />
            {item.videos.length < 3 && <VideoInput scope="visit" id={visitId} label="Add video" maxSeconds={ITEM_SECONDS} onVideo={onVideo} />}
          </div>
          <QuoteFields quote={item.quote ?? null} onQuote={onQuote} />
        </div>
      )}

      {item.s === "pass" && item.photos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.photos.map((p) => (
            <Image key={p.id} src={p.thumb} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-[8px] object-cover" />
          ))}
        </div>
      )}
      {item.s === "pass" && <div className="mt-2"><PhotoInput onPhoto={onPhoto} label="Add photo" /></div>}
    </div>
  );
}

function Review({
  id, draft, todo, back, onJump,
}: { id: string; draft: DraftRoom[]; todo: string[]; back: () => void; onJump: (room: string) => void }) {
  const [state, submit] = useActionState(submitVisit, { ok: false } as FieldState);
  const counts = draft.reduce(
    (a, r) => { for (const i of r.items) if (i.s) a[i.s]++; return a; },
    { pass: 0, attn: 0, fail: 0 } as Record<ItemState, number>,
  );
  const photos = draft.reduce((n, r) => n + r.items.reduce((m, i) => m + i.photos.length, 0), 0);

  return (
    <div className="grid gap-4">
      <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2">
        <X size={14} /> Back to the checklist
      </button>

      <div className="card border border-line bg-white p-5 shadow-card">
        <h2 className="serif text-[24px] tracking-[-0.03em]">Before you submit</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {([["pass", "OK", "text-pass"], ["attn", "Attention", "text-warn"], ["fail", "Fail", "text-fail"]] as const).map(([k, l, c]) => (
            <div key={k} className="rounded-[12px] bg-paper px-3 py-3">
              <div className={cn("text-[22px] font-medium leading-none tabular-nums", c)}>{counts[k]}</div>
              <div className="t-small mt-1">{l}</div>
            </div>
          ))}
        </div>
        <p className="t-small mt-2.5">{photos} photograph{photos === 1 ? "" : "s"} · {draft.filter((r) => r.video).length} of {draft.length} rooms filmed — all from the camera, stamped with time and place</p>
      </div>

      {todo.length > 0 && (
        <div className="card border border-warn/30 bg-warn-soft p-4">
          <div className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
            <AlertTriangle size={16} className="text-warn" /> {todo.length} thing{todo.length > 1 ? "s" : ""} still to finish
          </div>
          <ul className="mt-2.5 grid gap-1.5">
            {todo.slice(0, 8).map((t) => {
              const room = t.split(" — ")[0].split(" · ")[0];
              return (
                <li key={t}>
                  <button type="button" onClick={() => onJump(room)} className="w-full rounded-[10px] bg-white/70 px-3 py-2 text-left text-[13px] leading-snug text-text-2">
                    {t}
                  </button>
                </li>
              );
            })}
            {todo.length > 8 && <li className="t-small px-1">…and {todo.length - 8} more</li>}
          </ul>
        </div>
      )}

      <form action={submit} className="card border border-line bg-white p-5 shadow-card">
        <input type="hidden" name="id" value={id} />
        <label className="block">
          <span className="text-[15px] font-semibold">In your words</span>
          <p className="t-small mt-0.5 mb-2">
            The owner reads this before anything else. What is the state of the place, and what actually needs doing?
          </p>
          <textarea
            name="summary" rows={5} required minLength={40}
            placeholder="The house is in good order for a place shut five months. One thing needs a decision — a slow leak under the first bathroom sink…"
            className="w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </label>

        {state.error && (
          <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] leading-snug text-[#b03434]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {state.error}
          </p>
        )}

        <SubmitButton className="mt-4 w-full" pendingLabel="Sending the report…">
          <Send size={16} /> Submit the visit
        </SubmitButton>
        <p className="t-small mt-3 leading-snug">
          Once submitted, nothing here can be edited — that is the point of it. Anything you flagged becomes a question the owner answers.
        </p>
      </form>
    </div>
  );
}

/* What fixing it costs on Urban Company today — looked up by the person
   standing in front of it: the price of the work, any parts, and whether
   Care+ can cover it at all. The owner sees the price, our 15% on top
   (none when Care+ is covering it), and pays the rest when they approve.
   Optional: leave it blank and the owner sees "no price yet". */
function QuoteFields({ quote, onQuote }: { quote: DraftQuote | null; onQuote: (q: Required<DraftQuote>) => void }) {
  const [service, setService] = useState(quote?.service ?? "");
  const [price, setPrice] = useState(quote?.price ? String(quote.price) : "");
  const [parts, setParts] = useState(quote?.parts ? String(quote.parts) : "");
  const [excluded, setExcluded] = useState(!!quote?.excluded);
  const n = Number(price) || 0;
  const pt = Number(parts) || 0;
  const fee = Math.round((n + pt) * FEE_RATE);
  const save = (over: Partial<Required<DraftQuote>> = {}) =>
    onQuote({ service: service.trim(), price: n, parts: pt, excluded, ...over });
  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);
  const rupee = "flex h-10 items-center rounded-[10px] border border-line-2 bg-white px-3 focus-within:border-accent";
  const box = "w-full min-w-0 bg-transparent pl-1 text-[14px] tabular-nums outline-none";
  const inr = (x: number) => `₹${x.toLocaleString("en-IN")}`;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-2">
        <Wrench size={12} className="shrink-0" /> Repair price — the same service on Urban Company, today
      </p>
      <input value={service} onChange={(e) => setService(e.target.value.slice(0, 80))} onBlur={() => save()}
        placeholder="Service, e.g. Tap repair"
        className="mt-2 h-10 w-full min-w-0 rounded-[10px] border border-line-2 bg-white px-3 text-[14px] outline-none focus:border-accent" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className={rupee}>
          <span className="text-[14px] text-text-3">₹</span>
          <input value={price} inputMode="numeric" onChange={(e) => setPrice(digits(e.target.value))} onBlur={() => save()} placeholder="Service price" className={box} />
        </label>
        <label className={rupee}>
          <span className="text-[14px] text-text-3">₹</span>
          <input value={parts} inputMode="numeric" onChange={(e) => setParts(digits(e.target.value))} onBlur={() => save()} placeholder="Parts, if any" className={box} />
        </label>
      </div>
      <label className="mt-2 flex items-start gap-2 text-[12.5px] leading-snug text-text-2">
        <input type="checkbox" checked={excluded} onChange={(e) => { setExcluded(e.target.checked); save({ excluded: e.target.checked }); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
        Not under Care+ — an appliance, structural or civil work, cosmetic, or damage from misuse, pests or weather
      </label>
      {n > 0 && (
        <p className="t-small mt-1.5 tabular-nums">
          Owner sees {inr(n)} on Urban Company{pt ? ` + ${inr(pt)} parts` : ""} + {inr(fee)} ours ({Math.round(FEE_RATE * 100)}%) = <b className="text-ink">{inr(n + pt + fee)}</b>.
          {!excluded && ` On Care+ the cover takes the work and up to ${inr(carePlusCover.partsPerIncident)} of parts, with no fee.`}
        </p>
      )}
    </div>
  );
}
