import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";       // postgres.js needs Node, not Edge
export const dynamic = "force-dynamic";

const MAX_BODY = 32 * 1024;

type Payload = Record<string, unknown>;

const str = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const bool = (v: unknown) => v === true || v === "true" || v === "on";
type Json = null | string | number | boolean | Json[] | { [k: string]: Json };
const obj = (v: unknown): Json =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
const dateOrNull = (v: unknown) => {
  const s = str(v, 32);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export async function POST(req: NextRequest) {
  let body: Payload;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return bad("That submission was too large.", 413);
    body = JSON.parse(raw) as Payload;
  } catch {
    return bad("We could not read that submission.", 400);
  }

  // Honeypot: a real person never sees or fills this field. Accept silently so
  // the bot believes it succeeded and does not retry with a different shape.
  if (str(body.company)) return NextResponse.json({ ok: true });

  const sql = db();
  if (!sql) {
    console.error("[leads] DATABASE_URL is not set — refusing to fake success", safeLog(body));
    return bad("We could not save that just now.", 503);
  }

  const source = str(body.source, 300) || req.headers.get("referer") || "";
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? "";

  try {
    if (body.kind === "inspector") return await inspector(sql, body, source, ua);
    return await owner(sql, body, source, ua);
  } catch (err) {
    // The lead must survive a database problem: log the whole payload so it can
    // be recovered from the Vercel logs, and tell the person the truth.
    console.error("[leads] insert failed — payload follows", err, JSON.stringify(body));
    return bad("We could not save that just now.", 503);
  }
}

async function owner(
  sql: NonNullable<ReturnType<typeof db>>,
  b: Payload,
  source: string,
  ua: string
) {
  const name = str(b.name, 120);
  const email = str(b.email, 200).toLowerCase();
  const address = str(b.address, 400);

  if (!name || !address) return bad("Please add your name and the property address.", 422);
  if (!isEmail(email)) return bad("That email address does not look right.", 422);

  const [row] = await sql`
    insert into owner_leads (
      name, email, phone, lives_in, address, property_type, preferred_date,
      service, plan_id, size, rooms, addons, estimate_inr,
      live_call, valuables_ack, source, user_agent
    ) values (
      ${name}, ${email}, ${str(b.phone, 40)}, ${str(b.livesIn, 120)},
      ${address}, ${str(b.propertyType, 60)}, ${dateOrNull(b.preferredDate)},
      ${str(b.service, 40)}, ${str(b.planId, 60)}, ${str(b.size, 8)},
      ${sql.json(obj(b.rooms))}, ${sql.json(obj(b.addons))},
      ${Number.isFinite(Number(b.estimateInr)) ? Math.round(Number(b.estimateInr)) : null},
      ${bool(b.liveCall)}, ${bool(b.valuablesAck)}, ${source}, ${ua}
    )
    on conflict (lower(email), lower(address))
      do update set created_at = now(), status = 'new'
    returning id
  `;

  await notify(`New enquiry — ${name}`, [
    ["Name", name],
    ["Email", email],
    ["Phone", str(b.phone, 40)],
    ["Lives in", str(b.livesIn, 120)],
    ["Property", address],
    ["Type", str(b.propertyType, 60)],
    ["Service", str(b.service, 40)],
    ["Plan", str(b.planId, 60)],
    ["Preferred date", str(b.preferredDate, 32)],
    ["Estimate", b.estimateInr ? `₹${b.estimateInr}` : ""],
  ]);

  return NextResponse.json({ ok: true, id: row.id });
}

async function inspector(
  sql: NonNullable<ReturnType<typeof db>>,
  b: Payload,
  source: string,
  ua: string
) {
  const name = str(b.name, 120);
  const phone = str(b.phone, 40);
  const email = str(b.email, 200).toLowerCase();
  const city = str(b.city, 80);

  if (!name || !phone || !city) return bad("Please add your name, phone and city.", 422);
  if (!isEmail(email)) return bad("That email address does not look right.", 422);

  const [row] = await sql`
    insert into inspector_applications (
      name, dob, phone, email, city, localities, occupation, experience,
      documents, smartphone, mobile_data, travel, distance, visits_per_week,
      commitment, availability, ref_name, ref_phone, ref_relation,
      declarations, source, user_agent
    ) values (
      ${name}, ${dateOrNull(b.dob)}, ${phone}, ${email}, ${city},
      ${str(b.localities, 300)}, ${str(b.occupation, 160)}, ${str(b.experience, 40)},
      ${sql.json(obj(b.documents))}, ${str(b.smartphone, 60)}, ${str(b.mobileData, 60)},
      ${str(b.travel, 60)}, ${str(b.distance, 60)}, ${str(b.visitsPerWeek, 20)},
      ${str(b.commitment, 60)}, ${sql.json(obj(b.availability))},
      ${str(b.refName, 120)}, ${str(b.refPhone, 40)}, ${str(b.refRelation, 160)},
      ${sql.json(obj(b.declarations))}, ${source}, ${ua}
    )
    on conflict (phone) do update set created_at = now(), status = 'new'
    returning id
  `;

  await notify(`Inspector application — ${name}, ${city}`, [
    ["Name", name],
    ["Phone", phone],
    ["Email", email],
    ["City", city],
    ["Localities", str(b.localities, 300)],
    ["Occupation", str(b.occupation, 160)],
    ["Experience", str(b.experience, 40)],
    ["Visits a week", str(b.visitsPerWeek, 20)],
  ]);

  return NextResponse.json({ ok: true, id: row.id });
}

function bad(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Log the shape of a payload without spilling contact details into logs. */
function safeLog(b: Payload) {
  return { kind: b.kind, keys: Object.keys(b).length };
}
