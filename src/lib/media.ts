/* ════════════════════════════════════════════════════════════════
   Where the inspectors' video clips live.

   A clip is far too big for the database — a room walkthrough is a few
   megabytes — so the file goes to object storage and the database keeps
   a pointer (`Video.key`). The phone uploads straight to storage over a
   short-lived signed link; nothing large passes through our servers.

   Production: a private Cloudflare R2 bucket (any S3-compatible bucket
   works). People watch through /api/media/view, which checks they may
   see that visit and then hands out a link that expires in minutes.

   Development with no bucket set: files go to .data/media on disk, and
   the same routes write and serve them — so recording works locally.
   ════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import type { Video } from "@/lib/types";

const bucket = () => {
  const account = process.env.R2_ACCOUNT_ID, id = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY, name = process.env.R2_BUCKET;
  return account && id && secret && name ? { account, id, secret, name } : null;
};

/** Can clips be stored here at all? Production needs the bucket. */
export const mediaReady = () => !!bucket() || process.env.NODE_ENV !== "production";
const onDisk = () => !bucket() && process.env.NODE_ENV !== "production";

/** Longest and largest a clip may be — a room walkthrough at the
    recorder's bitrate is well inside this. */
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 120;

const EXT: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
export const baseMime = (m: string) => m.split(";")[0].trim().toLowerCase();
export const extFor = (mime: string) => EXT[baseMime(mime)] ?? null;

/** Every key is minted here, so any other shape is somebody guessing. */
const KEY = /^(visits|repairs)\/[A-Za-z0-9_-]{1,64}\/[0-9a-f-]{36}\.(mp4|webm|mov)$/;
export const validKey = (key: string) => KEY.test(key);
export const keyScope = (key: string) => {
  const [kind, id] = key.split("/");
  return { kind: kind as "visits" | "repairs", id };
};

/* ── R2 ──────────────────────────────────────────────────────── */

let client: AwsClient | null = null;
const aws = () => {
  const b = bucket()!;
  client ??= new AwsClient({ accessKeyId: b.id, secretAccessKey: b.secret, service: "s3", region: "auto" });
  return client;
};
const objectUrl = (key: string) => {
  const b = bucket()!;
  return `https://${b.account}.r2.cloudflarestorage.com/${b.name}/${key}`;
};
const presign = async (key: string, method: "PUT" | "GET", seconds: number) =>
  (await aws().sign(new Request(`${objectUrl(key)}?X-Amz-Expires=${seconds}`, { method }), { aws: { signQuery: true } })).url;

/* ── disk, for development ───────────────────────────────────── */

const DIR = path.join(process.cwd(), ".data", "media");
export const diskPath = (key: string) => (validKey(key) ? path.join(DIR, key) : null);

/* ── the four things callers need ────────────────────────────── */

/** Where the phone should PUT the file, for the next fifteen minutes. */
export async function uploadUrl(key: string) {
  return onDisk() ? `/api/media/local?key=${encodeURIComponent(key)}` : presign(key, "PUT", 900);
}

/** A link to watch the clip. On disk it is our own route; on R2 it
    expires in ten minutes, so a copied link is soon useless. */
export async function viewUrl(key: string) {
  return onDisk() ? null : presign(key, "GET", 600);
}

/** Did the upload actually land, and how big is it? */
export async function stored(key: string): Promise<number | null> {
  if (!validKey(key)) return null;
  if (onDisk()) {
    try { return fs.statSync(diskPath(key)!).size; } catch { return null; }
  }
  const res = await aws().fetch(objectUrl(key), { method: "HEAD" });
  return res.ok ? Number(res.headers.get("content-length") ?? 0) : null;
}

/** Best effort: a clip replaced or removed before submit. */
export async function discard(key: string) {
  if (!validKey(key)) return;
  try {
    if (onDisk()) fs.rmSync(diskPath(key)!, { force: true });
    else await aws().fetch(objectUrl(key), { method: "DELETE" });
  } catch { /* an orphan file costs pennies; a failed request must not */ }
}

/** A clip as the form sends it, checked field by field — or null. The
    file must already be in storage, under the prefix this caller may
    write to. */
export async function readVideo(raw: string, prefix: string): Promise<Video | null> {
  let v: Partial<Video>;
  try { v = JSON.parse(raw); } catch { return null; }
  const key = String(v.key ?? "");
  if (!validKey(key) || !key.startsWith(prefix)) return null;
  const mime = baseMime(String(v.mime ?? ""));
  if (!EXT[mime]) return null;
  const durationS = Number(v.durationS);
  if (!Number.isFinite(durationS) || durationS <= 0 || durationS > MAX_VIDEO_SECONDS + 5) return null;
  const size = await stored(key);
  if (!size || size > MAX_VIDEO_BYTES) return null;
  const poster = String(v.poster ?? "");
  const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : null);
  return {
    id: String(v.id ?? "").slice(0, 60) || key.split("/")[2].split(".")[0],
    key, mime, sizeBytes: size, durationS: Math.round(durationS),
    poster: poster.startsWith("data:image/") ? poster.slice(0, 80_000) : "",
    at: new Date().toISOString(), lat: num(v.lat), lng: num(v.lng),
  };
}
