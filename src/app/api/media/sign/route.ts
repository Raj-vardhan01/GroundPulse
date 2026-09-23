import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { APPS_LIVE } from "@/lib/flags";
import { inspectorFor } from "@/lib/field";
import { db } from "@/lib/store";
import { todayKey } from "@/lib/format";
import { extFor, mediaReady, MAX_VIDEO_BYTES, uploadUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* An inspector asks where to upload a clip they just recorded. They get a
   fresh key under the visit (or repair) they are working, and a link to
   put it there — only while that work is actually open to them. */
export async function POST(req: NextRequest) {
  if (!APPS_LIVE) return fail("Not found.", 404);
  if (!mediaReady()) return fail("Video storage is not set up yet.", 503);
  const user = await currentUser();
  const ins = user?.role === "inspector" ? await inspectorFor(user.id) : null;
  if (!ins) return fail("Sign in as an inspector.", 401);

  let body: { scope?: string; id?: string; mime?: string; size?: number };
  try { body = await req.json(); } catch { return fail("Bad request.", 400); }
  const scope = body.scope === "repair" ? "repair" : "visit";
  const id = String(body.id ?? "").slice(0, 64);
  const ext = extFor(String(body.mime ?? ""));
  const size = Number(body.size);
  if (!ext) return fail("That video format cannot be kept.", 415);
  if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_BYTES) return fail("That clip is too long — keep it under a minute and a half.", 413);

  const d = await db();
  if (scope === "visit") {
    const v = d.visits.find((x) => x.id === id);
    if (!v || v.inspectorId !== ins.id || v.status !== "on_site") return fail("This visit is not open for you.", 403);
  } else {
    const iss = d.issues.find((x) => x.id === id);
    const found = iss && d.visits.some((v) => v.id === iss.visitId && v.inspectorId === ins.id);
    const r = iss?.repair;
    if (!found || !r || r.status === "completed" || !r.scheduledFor || r.scheduledFor > todayKey()) return fail("This repair is not open for you.", 403);
  }

  const key = `${scope === "visit" ? "visits" : "repairs"}/${id}/${randomUUID()}.${ext}`;
  return NextResponse.json({ key, url: await uploadUrl(key) });
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
