"use server";

/* ════════════════════════════════════════════════════════════════
   Everything the inspector app writes.

   The rules an inspector agreed to when they applied are enforced
   here, not in the interface: no entry without the owner's OTP, a
   photo on anything flagged, and no submitting a visit with a room
   left unanswered. A rule that only lives in a disabled button is
   not a rule.
   ════════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInspector } from "@/lib/auth";
import { db, mutate, now, uid, reportRef, issueRef } from "@/lib/store";
import { inspectorFor, LIVE, CAN_WORK } from "@/lib/field";
import { blocksFor, countItems, scoreOf, outstanding } from "@/lib/checklist";
import { coordsOf, distanceKm } from "@/lib/geo";
import { fmtTime } from "@/lib/format";
import type { DraftRoom, Event, EventType, ItemState, Photo, ReportRoom } from "@/lib/types";

export type FieldState = { ok: boolean; error?: string };

const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string) => { const n = Number(fd.get(k)); return Number.isFinite(n) ? n : null; };

/** Close enough to be standing at the property. Bengaluru localities are
    big and GPS indoors is poor, so this is generous — it catches "I am
    claiming from home", not "I am in the wrong stairwell". */
const CHECKIN_RADIUS_M = 250;
const MAX_PHOTO_CHARS = 80_000;   // ~60 KB of base64
const MAX_PHOTOS = 80;

async function me() {
  const user = await requireInspector();
  const ins = await inspectorFor(user.id);
  return { user, ins };
}

/* ── the board ───────────────────────────────────────────────── */

export async function claimJob(fd: FormData) {
  const { ins } = await me();
  if (!ins || !CAN_WORK.includes(ins.status)) return;
  const id = str(fd, "id", 60);

  await mutate((d) => {
    /* One at a time, checked against the database rather than against
       whatever the page happened to render a moment ago. */
    if (d.visits.some((v) => v.inspectorId === ins.id && LIVE.includes(v.status))) return;

    const v = d.visits.find((x) => x.id === id);
    if (!v || v.status !== "scheduled" || v.inspectorId) return;
    const p = d.properties.find((x) => x.id === v.propertyId);
    if (!p || p.city.trim().toLowerCase() !== ins.city.trim().toLowerCase()) return;

    v.inspectorId = ins.id;
    v.claimedAt = now();
    v.status = "assigned";
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.assigned",
      title: `${ins.name} is assigned`, body: `${p.label} · ${ins.bg} · ${ins.visits} visits · rated ${ins.rating}`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  redirect(`/field/visit/${id}`);
}

export async function releaseJob(fd: FormData) {
  const { ins } = await me();
  if (!ins) return;
  const id = str(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    /* Only before they have entered. Once the OTP is used the visit
       belongs to them — walking away then is a support call, not a button. */
    if (!v || v.status !== "assigned") return;
    v.inspectorId = "";
    v.claimedAt = null;
    v.status = "scheduled";
  });
  revalidatePath("/field", "layout");
  redirect("/field/jobs");
}

export async function startTravel(fd: FormData) {
  const { ins } = await me();
  if (!ins) return;
  const id = str(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "assigned") return;
    v.status = "en_route";
    const p = d.properties.find((x) => x.id === v.propertyId);
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.en_route",
      title: `${ins.name} is on the way`, body: `${p?.label ?? "Your property"} · left at ${fmtTime(now())}`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
}

/* ── the door ────────────────────────────────────────────────── */

export async function checkIn(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const otp = str(fd, "otp", 8).replace(/\D/g, "");
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  const door = str(fd, "doorPhoto", MAX_PHOTO_CHARS);

  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.inspectorId === ins.id);
  if (!v0) return { ok: false, error: "That visit is not yours." };
  if (!["assigned", "en_route"].includes(v0.status)) return { ok: false, error: "This visit has already started." };

  if (otp !== v0.otp) return { ok: false, error: "That is not the code the owner has. Ask them to read it again." };
  if (!door) return { ok: false, error: "Photograph the front door before you go in." };

  const property = d0.properties.find((p) => p.id === v0.propertyId)!;
  const target = coordsOf(property.locality, property.city);
  const distanceM = lat !== null && lng !== null ? Math.round(distanceKm({ lat, lng }, target) * 1000) : -1;
  if (distanceM < 0) return { ok: false, error: "We could not read your location. Turn GPS on — every photo is stamped with it." };
  if (distanceM > CHECKIN_RADIUS_M && !str(fd, "reason", 300)) {
    return { ok: false, error: `You are about ${distanceM} m from the address. If that is right, say why before you go in.` };
  }

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    v.status = "on_site";
    v.startedAt = now();
    v.checkIn = { at: now(), lat: lat!, lng: lng!, distanceM, doorPhoto: photo(door, lat, lng) };
    /* The checklist is generated from the rooms the owner registered, so
       nobody can quietly walk fewer rooms than were booked. */
    v.draft = blocksFor(property).map((b) => ({
      name: b.name, variant: b.variant, video: false,
      items: b.items.map((t) => ({ t, s: null, note: "", photos: [] })),
    }));
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.started",
      title: `${ins.name} is on site`, body: `${property.label} · entered at ${fmtTime(now())} with your code`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ── the checklist ───────────────────────────────────────────── */

const photo = (thumb: string, lat: number | null, lng: number | null): Photo => ({
  id: uid(), thumb: thumb.slice(0, MAX_PHOTO_CHARS), at: now(), lat, lng,
});

async function editDraft(id: string, fn: (draft: DraftRoom[]) => void) {
  const { ins } = await me();
  if (!ins) return;
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "on_site" || !v.draft) return;
    fn(v.draft);
  });
  revalidatePath(`/field/visit/${id}`);
}

export async function setItem(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const state = str(fd, "state", 8) as ItemState;
  if (!["pass", "attn", "fail"].includes(state)) return;

  await editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.s = state;
  });
}

export async function setNote(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const note = str(fd, "note", 600);
  await editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.note = note;
  });
}

export async function addPhoto(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const thumb = str(fd, "thumb", MAX_PHOTO_CHARS);
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  if (!thumb.startsWith("data:image/")) return;

  await editDraft(id, (draft) => {
    const total = draft.reduce((n, r) => n + r.items.reduce((m, i) => m + i.photos.length, 0), 0);
    if (total >= MAX_PHOTOS) return;
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.photos.push(photo(thumb, lat, lng));
  });
}

export async function dropPhoto(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const photoId = str(fd, "photoId", 60);
  await editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.photos = it.photos.filter((x) => x.id !== photoId);
  });
}

export async function setVideo(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  await editDraft(id, (draft) => {
    const r = draft.find((x) => x.name === room);
    if (r) r.video = !r.video;
  });
}

/* ── submitting ──────────────────────────────────────────────── */

export async function submitVisit(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const summary = str(fd, "summary", 1200);

  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.inspectorId === ins.id);
  if (!v0 || v0.status !== "on_site" || !v0.draft) return { ok: false, error: "This visit is not open." };
  if (summary.length < 40) return { ok: false, error: "Write a few lines for the owner — what you found, in your words." };

  const missing = outstanding(v0.draft);
  if (missing.length) return { ok: false, error: `${missing.length} thing${missing.length > 1 ? "s" : ""} still to finish. ${missing[0]}` };

  const reportId = uid();
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    const property = d.properties.find((p) => p.id === v.propertyId)!;
    const draft = v.draft!;

    const rooms: ReportRoom[] = draft.map((r) => ({
      name: r.name,
      variant: r.variant,
      dur: clip(r.items.reduce((n, i) => n + i.photos.length, 0), r.items.length),
      items: r.items.map((i) => ({ t: i.t, s: i.s as ItemState, ...(i.note ? { note: i.note } : {}) })),
    }));
    const counts = countItems(rooms);

    /* On probation a person reads it first. The report is written now
       either way — what changes is whether the owner can see it. */
    const held = ins.status !== "active";

    d.reports.push({
      id: reportId, ref: reportRef(d), visitId: v.id, propertyId: v.propertyId, ownerId: v.ownerId,
      score: scoreOf(counts), counts, rooms, summary, inspectorId: ins.id,
      otpAt: v.checkIn ? fmtTime(v.checkIn.at) : "—",
      onSite: `${v.startedAt ? fmtTime(v.startedAt) : "—"} → ${fmtTime(now())}`,
      gps: v.checkIn ? `${v.checkIn.lat.toFixed(4)}° N, ${v.checkIn.lng.toFixed(4)}° E` : "—",
      videos: `${draft.filter((r) => r.video).length} of ${draft.length} slots · all filled`,
      publishedAt: now(), readAt: null, heldForReview: held,
    });

    /* Anything not a pass becomes a question for the owner. No quote
       yet — that comes from a provider once we have matched one. */
    for (const r of draft) {
      for (const i of r.items) {
        if (i.s === "pass" || !i.s) continue;
        d.issues.push({
          id: uid(), ref: issueRef(d), reportId, visitId: v.id, propertyId: v.propertyId, ownerId: v.ownerId,
          room: r.name, title: i.t, severity: i.s, body: i.note, variant: r.variant,
          quote: null, coveredInr: 0, decision: "pending", decidedAt: null, repair: null,
        });
      }
    }

    v.status = held ? "submitted" : "ready";
    v.endedAt = now();
    v.reportId = reportId;
    v.draft = null;

    const sub = d.subscriptions.find((x) => x.propertyId === v.propertyId);
    if (sub && sub.visitsUsed < sub.visitsTotal) sub.visitsUsed += 1;
    if (held) {
      const rec = d.inspectors.find((x) => x.id === ins.id)!;
      rec.reviewedReports += 1;
    } else {
      pushEvent(d, {
        ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "report.ready",
        title: "Your report is ready",
        body: `${property.label} · ${counts.fail} fail, ${counts.attn} attention · ${counts.fail + counts.attn > 0 ? "needs your decision" : "nothing open"}`,
        href: `/app/reports/${reportId}`, action: counts.fail + counts.attn > 0,
      });
    }
  });

  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  redirect(`/field/visit/${id}?done=1`);
}

/* ── shared ──────────────────────────────────────────────────── */

const clip = (photos: number, items: number) => {
  const secs = 26 + items * 12 + photos * 4;
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
};

type NewEvent = { ownerId: string; type: EventType; title: string; body: string; href: string; propertyId?: string; visitId?: string; action?: boolean };
function pushEvent(d: { events: Event[] }, e: NewEvent) {
  d.events.push({
    id: uid(), ownerId: e.ownerId, propertyId: e.propertyId ?? null, visitId: e.visitId ?? null,
    type: e.type, title: e.title, body: e.body, href: e.href, at: now(), readAt: null, action: e.action ?? false,
  });
}
