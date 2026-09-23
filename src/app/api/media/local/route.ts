import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { diskPath, MAX_VIDEO_BYTES, mediaReady } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Development only: where a clip lands when there is no bucket. In
   production — or anywhere a bucket is set — the phone uploads straight
   to storage and this route does not exist. */
export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.R2_BUCKET || !mediaReady()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const user = await currentUser();
  if (user?.role !== "inspector") return NextResponse.json({ error: "Sign in as an inspector." }, { status: 401 });
  const file = diskPath(req.nextUrl.searchParams.get("key") ?? "");
  if (!file) return NextResponse.json({ error: "Bad key." }, { status: 400 });

  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_VIDEO_BYTES) return NextResponse.json({ error: "Too large." }, { status: 413 });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
  return new NextResponse(null, { status: 200 });
}
