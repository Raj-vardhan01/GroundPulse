import fs from "node:fs";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { currentUser, isOps } from "@/lib/auth";
import { APPS_LIVE } from "@/lib/flags";
import { db } from "@/lib/store";
import { balanceDue } from "@/lib/payments";
import { diskPath, keyScope, validKey, viewUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Watching a clip. Only the owner of that property, the inspector who
   filmed it, ops — or whoever holds the report's family link — gets
   through; everyone else sees nothing, the same as a clip that does not
   exist. A clip in a report still being reviewed stays with the
   inspector and ops until it is released. */
export async function GET(req: NextRequest) {
  if (!APPS_LIVE) return none();
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!validKey(key)) return none();

  const d = await db();
  const user = await currentUser();
  const { kind, id } = keyScope(key);
  const visitId = kind === "visits" ? id : d.issues.find((i) => i.id === id)?.visitId;
  const visit = d.visits.find((v) => v.id === visitId);
  if (!visit) return none();
  const report = d.reports.find((r) => r.visitId === visit.id) ?? null;
  const inspector = d.inspectors.find((i) => i.id === visit.inspectorId);

  /* A report whose balance is unpaid shows its headline only — the
     clips open with the rest of it. */
  const open = !!report && !report.heldForReview && !balanceDue(d, visit.id);
  const allowed =
    (await isOps()) ||
    (!!user && inspector?.userId === user.id) ||
    (!!user && user.id === visit.ownerId && open) ||
    (open && token.length >= 20 && report!.shareToken === token);
  if (!allowed) return none();

  const signed = await viewUrl(key);
  if (signed) return NextResponse.redirect(signed, { status: 302, headers: { "cache-control": "private, no-store" } });
  return fromDisk(req, key);
}

function fromDisk(req: NextRequest, key: string) {
  const file = diskPath(key);
  if (!file || !fs.existsSync(file)) return none();
  const size = fs.statSync(file).size;
  const type = key.endsWith(".mp4") ? "video/mp4" : key.endsWith(".webm") ? "video/webm" : "video/quicktime";
  const head = { "content-type": type, "accept-ranges": "bytes", "cache-control": "private, max-age=600" };

  /* Safari will not play a video it cannot seek, and it seeks by asking
     for byte ranges. */
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    const body = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new NextResponse(body, { status: 206, headers: { ...head, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new NextResponse(body, { status: 200, headers: { ...head, "content-length": String(size) } });
}

const none = () => NextResponse.json({ error: "Not found." }, { status: 404 });
