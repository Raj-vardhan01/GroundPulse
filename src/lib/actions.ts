"use server";

/* ════════════════════════════════════════════════════════════════
   Every write the owner app makes. Each one re-checks who is asking
   — a server action is a public endpoint, and the fact that the
   button was only rendered for the right person proves nothing.
   ════════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, requireOwner, signOut, startOtp, verifyOtp } from "@/lib/auth";
import { db, invoiceRef, mutate, now, uid, visitRef } from "@/lib/store";
import { quote, inr } from "@/lib/quote";
import type { BhkKey } from "@/lib/cleaning";
import type { Event, EventType, Property, RoomKey, VisitKind } from "@/lib/types";

const s = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0) || 0;

export type FormState = { ok: boolean; error?: string; devCode?: string | null; phone?: string };

/* ── sign in ─────────────────────────────────────────────────── */

export async function requestCode(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await startOtp(s(fd, "phone", 20));
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, phone: res.phone, devCode: res.devCode };
}

export async function confirmCode(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await verifyOtp(s(fd, "phone", 20), s(fd, "code", 8));
  if (!res.ok) return { ok: false, error: res.error };
  redirect(res.onboarded ? "/app" : "/welcome");
}

export async function doSignOut() {
  await signOut();
  redirect("/");
}

/* ── profile ─────────────────────────────────────────────────── */

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session ended. Sign in again." };
  const name = s(fd, "name", 120);
  if (!name) return { ok: false, error: "We need a name to put on your reports." };

  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    u.name = name;
    u.email = s(fd, "email", 200).toLowerCase();
    u.livesIn = s(fd, "livesIn", 120);
  });
  revalidatePath("/app", "layout");
  if (s(fd, "step") === "welcome") redirect("/welcome/property");
  return { ok: true };
}

/* ── properties ──────────────────────────────────────────────── */

const ROOM_KEYS: RoomKey[] = ["bed", "bath", "living", "kitchen", "balcony", "study", "terrace", "parking"];

export async function addProperty(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner({ allowOnboarding: true });
  const label = s(fd, "label", 120);
  const address = s(fd, "address", 400);
  if (!label || !address) return { ok: false, error: "A name and the address, and we can take it from there." };

  const kind = (s(fd, "kind", 12) || "home") as Property["kind"];
  const rooms = Object.fromEntries(ROOM_KEYS.map((k) => [k, n(fd, `room_${k}`)])) as Record<RoomKey, number>;

  const id = uid();
  await mutate((d) => {
    d.properties.push({
      id,
      ownerId: user.id,
      kind,
      label,
      address,
      locality: s(fd, "locality", 120),
      city: s(fd, "city", 80) || "Bengaluru",
      type: (s(fd, "type", 40) || (kind === "home" ? "Apartment" : "")) as Property["type"],
      size: ((s(fd, "size", 2) || "2") as BhkKey),
      rooms,
      accessNote: s(fd, "accessNote", 600),
      keyHolderName: s(fd, "keyHolderName", 120),
      keyHolderPhone: s(fd, "keyHolderPhone", 40),
      cover: kind === "plot" ? "balcony" : "entrance",
      createdAt: now(),
      archivedAt: null,
    });
    pushEvent(d, {
      ownerId: user.id, propertyId: id, type: "property.added",
      title: `${label} added`, body: address, href: `/app/properties/${id}`,
    });
    /* Finishing the welcome flow is what marks an owner onboarded — the
       account is only useful once there is something in it. */
    const u = d.users.find((x) => x.id === user.id)!;
    if (!u.onboardedAt) u.onboardedAt = now();
  });

  revalidatePath("/app", "layout");
  redirect(s(fd, "step") === "welcome" ? `/app/book?property=${id}&welcome=1` : `/app/properties/${id}`);
}

export async function updateProperty(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const ok = await mutate((d) => {
    const p = d.properties.find((x) => x.id === id && x.ownerId === user.id);
    if (!p) return false;
    p.label = s(fd, "label", 120) || p.label;
    p.address = s(fd, "address", 400) || p.address;
    p.locality = s(fd, "locality", 120);
    p.accessNote = s(fd, "accessNote", 600);
    p.keyHolderName = s(fd, "keyHolderName", 120);
    p.keyHolderPhone = s(fd, "keyHolderPhone", 40);
    return true;
  });
  if (!ok) return { ok: false, error: "We could not find that property." };
  revalidatePath(`/app/properties/${id}`);
  return { ok: true };
}

/* ── booking ─────────────────────────────────────────────────── */

export async function bookVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const propertyId = s(fd, "propertyId", 60);
  const scheduledFor = s(fd, "scheduledFor", 12);
  const d0 = await db();
  const property = d0.properties.find((p) => p.id === propertyId && p.ownerId === user.id);
  if (!property) return { ok: false, error: "Pick which property this visit is for." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) return { ok: false, error: "Pick a date for the visit." };

  const kind = (s(fd, "kind", 20) || "inspection") as VisitKind;
  const planId = s(fd, "planId", 40) || (kind === "plot" ? "plot-once" : "one-time");
  const tierId = s(fd, "tierId", 12) as "refresh" | "deep" | "";
  const addOns: Record<string, number> = {};
  for (const k of ["cleaning", "deep", "car"]) { const v = n(fd, `add_${k}`); if (v > 0) addOns[k] = v; }

  const q = quote({ kind, planId, size: property.size, tierId, addOns });
  const id = uid();

  await mutate((d) => {
    const ref = visitRef(d);
    d.visits.push({
      id, ref, ownerId: user.id, propertyId, kind, planId, tierId, addOns,
      scheduledFor, slot: s(fd, "slot", 40) || "10:00 – 13:00",
      status: "scheduled", inspectorId: "", amountInr: q.total, paid: false,
      liveCall: fd.get("liveCall") === "on",
      notes: s(fd, "notes", 600), createdAt: now(), startedAt: null, endedAt: null, reportId: null,
    });

    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: user.id, propertyId, visitId: id,
      title: `${q.lines[0]?.k ?? "Visit"} · ${property.label}`,
      amountInr: q.total, status: "due", method: "", createdAt: now(),
    });

    /* A yearly plan is a subscription, not a one-off — record it so the
       plan screen can show visits left and when it renews. */
    if (q.recurring) {
      const plan = { care: 4, "care-plus": 4 }[planId] ?? 1;
      const existing = d.subscriptions.find((x) => x.propertyId === propertyId);
      const sub = {
        id: existing?.id ?? uid(), ownerId: user.id, propertyId, planId,
        visitsTotal: plan, visitsUsed: 0, amountInr: q.total, startedAt: now(),
        renewsAt: new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
        status: "active" as const, coverUsedInr: 0,
      };
      if (existing) Object.assign(existing, sub); else d.subscriptions.push(sub);
      pushEvent(d, { ownerId: user.id, propertyId, type: "plan.started", title: `${q.lines[0].k} started`, body: `${property.label} · renews ${sub.renewsAt}`, href: "/app/plan" });
    }

    pushEvent(d, {
      ownerId: user.id, propertyId, visitId: id, type: "visit.booked",
      title: "Visit booked", body: `${property.label} · ${scheduledFor} · ${s(fd, "slot", 40)}`,
      href: `/app/visits/${id}`,
    });
  });

  revalidatePath("/app", "layout");
  redirect(`/app/visits/${id}?new=1`);
}

export async function cancelVisit(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.ownerId === user.id);
    if (!v || !["scheduled", "assigned"].includes(v.status)) return;
    v.status = "cancelled";
    const inv = d.invoices.find((i) => i.visitId === id && i.status === "due");
    if (inv) d.invoices = d.invoices.filter((i) => i.id !== inv.id);
  });
  revalidatePath("/app", "layout");
  redirect("/app/visits");
}

export async function rescheduleVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const date = s(fd, "scheduledFor", 12);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Pick a new date." };
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.ownerId === user.id);
    if (!v || !["scheduled", "assigned"].includes(v.status)) return;
    v.scheduledFor = date;
    v.slot = s(fd, "slot", 40) || v.slot;
    v.status = "scheduled";
    v.inspectorId = "";
    pushEvent(d, { ownerId: user.id, propertyId: v.propertyId, visitId: id, type: "visit.booked", title: "Visit moved", body: `${date} · ${v.slot} — we will assign an inspector again`, href: `/app/visits/${id}` });
  });
  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ── decisions ───────────────────────────────────────────────── */

export async function decideIssue(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const approve = s(fd, "decision", 10) === "approve";

  await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id && i.ownerId === user.id);
    if (!iss || iss.decision !== "pending") return;
    iss.decision = approve ? "approved" : "declined";
    iss.decidedAt = now();

    if (approve && iss.quote) {
      iss.repair = {
        status: "assigned",
        providerName: iss.quote.provider,
        trade: iss.quote.trade,
        scheduledFor: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
        completedAt: null,
        note: "",
      };
      const sub = d.subscriptions.find((x) => x.propertyId === iss.propertyId);
      if (sub) sub.coverUsedInr += iss.coveredInr;
      d.invoices.push({
        id: uid(), ref: invoiceRef(d), ownerId: user.id, propertyId: iss.propertyId, visitId: iss.visitId,
        title: `${iss.title} · ${iss.ref}`,
        amountInr: Math.max(0, iss.quote.total - iss.coveredInr),
        status: "due", method: iss.coveredInr ? `Covered by your plan · ${inr(iss.coveredInr)} of ${inr(iss.quote.total)}` : "",
        createdAt: now(),
      });
    }

    pushEvent(d, {
      ownerId: user.id, propertyId: iss.propertyId, visitId: iss.visitId,
      type: approve ? "issue.approved" : "issue.declined",
      title: approve ? "You approved a repair" : "You declined a repair",
      body: `${iss.title} · ${iss.ref}${approve && iss.quote ? ` · ${inr(iss.quote.total)}` : ""}`,
      href: `/app/reports/${iss.reportId}`,
    });
  });

  revalidatePath("/app", "layout");
}

export async function markReportRead(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const r = d.reports.find((x) => x.id === id && x.ownerId === user.id);
    if (r && !r.readAt) r.readAt = now();
    for (const e of d.events) if (e.ownerId === user.id && e.href.endsWith(id) && !e.readAt) e.readAt = now();
  });
  revalidatePath("/app", "layout");
}

export async function markAllRead() {
  const user = await requireOwner();
  await mutate((d) => { for (const e of d.events) if (e.ownerId === user.id && !e.readAt) e.readAt = now(); });
  revalidatePath("/app", "layout");
}

export async function payInvoice(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const inv = d.invoices.find((i) => i.id === id && i.ownerId === user.id);
    if (!inv || inv.status === "paid") return;
    inv.status = "paid";
    inv.method = inv.method || "UPI · recorded locally";
    const v = d.visits.find((x) => x.id === inv.visitId);
    if (v) v.paid = true;
    pushEvent(d, { ownerId: user.id, propertyId: inv.propertyId, type: "invoice.paid", title: "Payment recorded", body: `${inv.title} · ${inr(inv.amountInr)}`, href: "/app/billing" });
  });
  revalidatePath("/app", "layout");
}

/* ── shared ──────────────────────────────────────────────────── */

type NewEvent = { ownerId: string; type: EventType; title: string; body: string; href: string; propertyId?: string; visitId?: string; action?: boolean };
function pushEvent(d: { events: Event[] }, e: NewEvent) {
  d.events.push({
    id: uid(), ownerId: e.ownerId, propertyId: e.propertyId ?? null, visitId: e.visitId ?? null,
    type: e.type, title: e.title, body: e.body, href: e.href, at: now(), readAt: null, action: e.action ?? false,
  });
}
