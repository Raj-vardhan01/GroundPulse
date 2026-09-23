/* ════════════════════════════════════════════════════════════════
   Ola Maps, from the server.

   Address search and "what is at this spot" go through here and never
   straight from the browser: the credential stays on the server, and
   every answer is remembered, so the same street typed twice is one
   call, not two.

   What Ola holds us to (fair usage policy, effective 1 Sep 2026):
   · 100,000 free calls a month per API; past that, prepaid credit —
     with no credit left, calls stop.
   · 2,000 a minute for autocomplete and for reverse geocoding.
   · 150,000 calls to one API in a day, on three days of any week,
     blocks the whole account for a day — every Ola service at once,
     the map included. Hence a ceiling per person below: one runaway
     tab must not be able to take the maps down for everybody.

   Two ways in. OLA_MAPS_CLIENT_ID + OLA_MAPS_CLIENT_SECRET (OAuth) is a
   server-only credential and is preferred when set. OLA_MAPS_API_KEY
   alone also works; each call names the site it is made for, which is
   what a key locked to our domains in the Ola console checks.
   ════════════════════════════════════════════════════════════════ */

const BASE = "https://api.olamaps.io";
const TOKEN_URL = "https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token";

/** Suggestions lean towards Bengaluru and out as far as Devanahalli and
    Hoskote. A nudge for the ranking, not a fence. */
const NEAR = "12.9716,77.5946";
const NEAR_RADIUS_M = "60000";

const apiKey = () => process.env.OLA_MAPS_API_KEY || "";
const oauth = () => {
  const id = process.env.OLA_MAPS_CLIENT_ID, secret = process.env.OLA_MAPS_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
};
export const searchReady = () => !!(apiKey() || oauth());

/* ── what the browser is told ────────────────────────────────── */

/** How the pin picker draws its map. The tiles are fetched by the
    browser itself, so this key is public by nature — lock it to our
    domains in the Ola console, or give the map its own key with
    OLA_MAPS_BROWSER_KEY. Without any key, a local dev server borrows
    OpenStreetMap's tiles so the picker can still be worked on;
    production shows no map rather than lean on a volunteer service. */
export type MapConfig = { tiles: "ola" | "osm" | "none"; key: string | null; search: boolean };

export function mapConfig(): MapConfig {
  const key = process.env.OLA_MAPS_BROWSER_KEY || apiKey();
  const search = searchReady();
  if (key) return { tiles: "ola", key, search };
  return { tiles: process.env.NODE_ENV === "production" ? "none" : "osm", key: null, search };
}

/* ── the answers, in our own shape ───────────────────────────── */

export type Place = { id: string; title: string; subtitle: string; lat: number | null; lng: number | null; locality: string };
export type Here = { address: string; locality: string };

type Prediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  terms?: { value?: string }[];
  geometry?: { location?: { lat?: number; lng?: number } };
};
type Geocoded = {
  formatted_address?: string;
  address_components?: { long_name?: string; types?: string[] }[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

export class OlaError extends Error {
  kind: "busy" | "failed" | "unset";
  constructor(kind: OlaError["kind"], detail = "") {
    super(`ola ${kind}${detail ? `: ${detail}` : ""}`);
    this.kind = kind;
  }
}

/* ── remembering ─────────────────────────────────────────────── */

/** A small forgetful map: oldest out first, nothing kept past its day. */
class Memo<T> {
  private m = new Map<string, { v: T; until: number }>();
  private max: number;
  private ttlMs: number;
  constructor(max: number, ttlMs: number) { this.max = max; this.ttlMs = ttlMs; }
  get(k: string) {
    const hit = this.m.get(k);
    if (!hit) return undefined;
    if (hit.until < Date.now()) { this.m.delete(k); return undefined; }
    return hit.v;
  }
  set(k: string, v: T) {
    if (this.m.size >= this.max) this.m.delete(this.m.keys().next().value!);
    this.m.set(k, { v, until: Date.now() + this.ttlMs });
  }
}
const DAY = 86_400_000;
const searches = new Memo<Place[]>(2000, DAY);
const points = new Memo<{ lat: number; lng: number } | null>(2000, 7 * DAY);
const heres = new Memo<Here | null>(2000, 7 * DAY);

/* ── one person's share ──────────────────────────────────────── */

/** Far above what somebody adding a property does — a few dozen
    searches — and far below what could bother Ola's daily ceiling. */
const PER_MINUTE = 40;
const PER_DAY = 600;
const spend = new Map<string, { minute: number; inMinute: number; day: string; inDay: number }>();

export function allow(who: string) {
  const t = Date.now();
  const minute = Math.floor(t / 60_000);
  const day = new Date(t).toISOString().slice(0, 10);
  const s = spend.get(who) ?? { minute, inMinute: 0, day, inDay: 0 };
  if (s.minute !== minute) { s.minute = minute; s.inMinute = 0; }
  if (s.day !== day) { s.day = day; s.inDay = 0; }
  if (s.inMinute >= PER_MINUTE || s.inDay >= PER_DAY) return false;
  s.inMinute += 1;
  s.inDay += 1;
  spend.set(who, s);
  return true;
}

/* ── calling Ola ─────────────────────────────────────────────── */

let token: { value: string; until: number } | null = null;

async function credentials(): Promise<{ headers: Record<string, string>; params: Record<string, string> }> {
  const o = oauth();
  if (o) {
    if (!token || token.until < Date.now()) {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", scope: "openid", client_id: o.id, client_secret: o.secret }),
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
      if (!res.ok || !j.access_token) throw new OlaError("failed", `token ${res.status}`);
      token = { value: j.access_token, until: Date.now() + Math.max(60, (j.expires_in ?? 300) - 60) * 1000 };
    }
    return { headers: { authorization: `Bearer ${token.value}` }, params: {} };
  }
  if (apiKey()) return { headers: {}, params: { api_key: apiKey() } };
  throw new OlaError("unset");
}

async function call<T>(path: string, params: Record<string, string>, site: string): Promise<T> {
  const c = await credentials();
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries({ ...params, ...c.params })) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { ...c.headers, "X-Request-Id": crypto.randomUUID(), origin: site, referer: `${site}/` },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (res.status === 429) throw new OlaError("busy");
  if (!res.ok) throw new OlaError("failed", String(res.status));
  return (await res.json()) as T;
}

const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : null);

/** The neighbourhood from a suggestion's pieces: whatever sits just
    before the city — "…, Whitefield, Bengaluru, Karnataka". */
function localityOf(terms: string[], title: string) {
  const city = terms.findIndex((t) => /bengaluru|bangalore/i.test(t));
  const before = city > 0 ? terms[city - 1] : "";
  return before && before !== title ? before : "";
}

/** Address suggestions as somebody types. Ola's suggestions carry their
    coordinates, so picking one costs nothing further. */
export async function searchPlaces(q: string, site: string): Promise<Place[]> {
  const k = q.trim().toLowerCase().replace(/\s+/g, " ");
  const hit = searches.get(k);
  if (hit) return hit;
  const j = await call<{ predictions?: Prediction[] }>("/places/v1/autocomplete", { input: q.trim(), location: NEAR, radius: NEAR_RADIUS_M }, site);
  const out = (j.predictions ?? []).slice(0, 6).map((p): Place => {
    const description = String(p.description ?? "");
    const title = p.structured_formatting?.main_text || description.split(",")[0].trim();
    const subtitle = p.structured_formatting?.secondary_text || description.split(",").slice(1).join(",").trim();
    const terms = (p.terms ?? []).map((t) => String(t?.value ?? "")).filter(Boolean);
    return {
      id: String(p.place_id ?? ""), title, subtitle,
      lat: num(p.geometry?.location?.lat), lng: num(p.geometry?.location?.lng),
      locality: localityOf(terms, title),
    };
  }).filter((p) => p.title);
  searches.set(k, out);
  return out;
}

/** Where a suggestion is, for the rare one that came without coordinates. */
export async function placePoint(id: string, site: string) {
  const hit = points.get(id);
  if (hit !== undefined) return hit;
  const j = await call<{ result?: Geocoded }>("/places/v1/details", { place_id: id }, site);
  const lat = num(j.result?.geometry?.location?.lat), lng = num(j.result?.geometry?.location?.lng);
  const out = lat !== null && lng !== null ? { lat, lng } : null;
  points.set(id, out);
  return out;
}

/** What is at a spot, for "near …" under the pin and to fill in the
    locality. Remembered to about a metre. */
export async function whatIsHere(lat: number, lng: number, site: string): Promise<Here | null> {
  const k = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const hit = heres.get(k);
  if (hit !== undefined) return hit;
  const j = await call<{ results?: Geocoded[] }>("/places/v1/reverse-geocode", { latlng: `${lat},${lng}` }, site);
  const r = j.results?.[0];
  let out: Here | null = null;
  if (r) {
    const parts = r.address_components ?? [];
    const pick = (...types: string[]) => parts.find((c) => c.types?.some((t) => types.includes(t)))?.long_name ?? "";
    out = {
      address: String(r.formatted_address ?? ""),
      locality: pick("sublocality_level_1", "sublocality", "neighborhood") || pick("locality"),
    };
  }
  heres.set(k, out);
  return out;
}
