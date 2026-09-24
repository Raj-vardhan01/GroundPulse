/* ════════════════════════════════════════════════════════════════
   Phone-OTP sign-in.

   An owner is often abroad on a foreign SIM, so any country's mobile
   works (see lib/phone) and the session lives in an httpOnly cookie
   for 30 days — long, because the whole point is opening the app at
   11 PM in another country without hunting for a password.

   Codes are sent by SMS through Fast2SMS. On a laptop no SMS is sent —
   the code is returned to the caller and shown on screen, clearly
   marked — unless SMS_IN_DEV=1.
   ════════════════════════════════════════════════════════════════ */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, mutate, now, uid } from "@/lib/store";
import { LIMIT } from "@/lib/offer";
import { isAccountPhone, isIndianMobile, parsePhone, reachOn } from "@/lib/phone";
import { canInspect, ensureInspector, mayInspect, NOT_ON_ROSTER } from "@/lib/roster";
import { sweepMissed } from "@/lib/jobs";
import type { Otp, User } from "@/lib/types";

export { prettyPhone } from "@/lib/phone";

const COOKIE = "sy_session";
const OTP_COOKIE = "sy_otp";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;

/* The brakes. Six digits is a million guesses — unless nothing stops
   somebody making them. Five wrong tries burns the code; a number can be
   sent a new code every thirty seconds, five times in fifteen minutes. */
const MAX_ATTEMPTS = 5;
const SEND_GAP_S = 30;
const MAX_SENDS = 5;
const SEND_WINDOW_MS = 15 * 60_000;
/* The per-number brake does not stop one machine asking for codes to a
   thousand different numbers — which costs a paid SMS each. So each
   address gets a ceiling too. Per server instance until the store is in
   Postgres; still a brake. */
const MAX_SENDS_PER_IP = 12;
const ipSends = new Map<string, number[]>();

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

async function ipAllowed() {
  const ip = await clientIp();
  const t = Date.now();
  const recent = (ipSends.get(ip) ?? []).filter((s) => t - s < SEND_WINDOW_MS);
  if (recent.length >= MAX_SENDS_PER_IP) return false;
  recent.push(t);
  ipSends.set(ip, recent);
  return true;
}

/* The session lives in the cookie itself, signed — not as an id looked
   up in a table.

   A stored session needs every server that might answer a request to
   see the same store. On a serverless host they do not: each instance
   has its own memory, so an owner who signed in on one instance was a
   stranger to the next and got thrown back to the sign-in page
   mid-booking. A signed cookie any instance can verify removes the
   lookup entirely — and it is the same shape a real deployment uses,
   so none of this is throwaway. */
/* Vercel holds it as SESSION_SECRET1; the older SESSION_SECRET still works
   if that is all a deployment has. The fallback below is written in this
   file for anyone to read, so anybody could forge a sign-in with it —
   fine on a laptop, never in production: there, no secret means no
   sign-in at all, loudly, on the first request that needs one. */
const DEV_SECRET = "stillyours-dev-secret-not-for-production";
function secret() {
  const s = process.env.SESSION_SECRET1 || process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET1 is not set — refusing to sign anything with the development secret.");
  return DEV_SECRET;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

/** Which app a session is in. One number can be an owner and an
    inspector; the door they came through decides, and switching is a
    button, not a second account. */
export type Side = "owner" | "inspector";
type SessionPayload = { u: string; e: number; s?: Side };

/** `<payload>.<signature>` — unreadable to nobody, unforgeable to everybody. */
function seal(userId: string, expiresAt: number, side: Side) {
  const body = b64(JSON.stringify({ u: userId, e: expiresAt, s: side } satisfies SessionPayload));
  return `${body}.${sign(body)}`;
}

function openSigned<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  /* Constant-time, so the comparison cannot be used to guess a signature
     one character at a time. */
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(unb64(body)) as T;
  } catch {
    return null;
  }
}

function unseal(token: string): SessionPayload | null {
  const payload = openSigned<SessionPayload>(token);
  if (!payload?.u || payload.e < Date.now()) return null;
  return payload;
}

/* Sign-in codes go out through Fast2SMS's OTP route, which reaches Indian
   mobiles only. FAST2SMS_API_KEY holds the key — in the environment, never
   in this repository.

   A laptop never sends a real SMS unless SMS_IN_DEV=1: the demo accounts
   use made-up numbers that belong to real people somewhere. */
type SmsResult = "sent" | "off" | "abroad" | "failed";

async function sendSms(phone: string, code: string): Promise<SmsResult> {
  const key = process.env.FAST2SMS_API_KEY?.trim();
  if (!key) return "off";
  if (process.env.NODE_ENV !== "production" && process.env.SMS_IN_DEV !== "1") return "off";
  if (!isIndianMobile(phone)) return "abroad";
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: key, "content-type": "application/json" },
      body: JSON.stringify({ route: "otp", variables_values: code, numbers: phone, flash: "0" }),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { return?: boolean; message?: unknown } | null;
    if (res.ok && body?.return) return "sent";
    console.error("[sms] Fast2SMS refused the code", res.status, body?.message);
  } catch (err) {
    console.error("[sms] Fast2SMS could not be reached", err);
  }
  return "failed";
}

/* The pending code travels in its own short-lived cookie rather than in
   the store, for the same reason the session does: the instance that
   sends the code is not necessarily the one that checks it. Only an
   HMAC of the code is in the cookie, so reading it — even your own —
   tells you nothing without the server's secret.

   The counters (sends, wrong tries) are in the store. Locally that is
   exact; on a serverless host it is per instance until the store is
   Postgres — still a brake, and exact the day that lands. */
type Purpose = Otp["purpose"];
type OtpCookie = { p: string; h: string; e: number; u?: Purpose };
const otpHash = (purpose: Purpose, phone: string, code: string) => sign(`${purpose}:${phone}:${code}`);

export type StartResult =
  | { ok: true; phone: string; devCode: string | null }
  | { ok: false; error: string; phone?: string };

export async function startOtp(cc: string, rawPhone: string, purpose: Purpose = "signin"): Promise<StartResult> {
  const parsed = parsePhone(cc, rawPhone);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const phone = parsed.phone;

  const t = Date.now();
  const d = await db();
  const row = d.otps.find((o) => o.phone === phone && o.purpose === purpose);
  const recent = (row?.sends ?? []).filter((s) => t - Date.parse(s) < SEND_WINDOW_MS);
  const last = recent.length ? Date.parse(recent[recent.length - 1]) : 0;
  if (last && t - last < SEND_GAP_S * 1000) {
    const wait = Math.ceil((SEND_GAP_S * 1000 - (t - last)) / 1000);
    return { ok: false, error: `A code was just sent. Wait ${wait} seconds before asking for another.`, phone };
  }
  if (recent.length >= MAX_SENDS) {
    return { ok: false, error: "That is a lot of codes for one number. Try again in fifteen minutes.", phone };
  }
  if (!(await ipAllowed())) {
    return { ok: false, error: "Too many codes asked for from here. Try again in fifteen minutes.", phone };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = otpHash(purpose, phone, code);
  const expiresAt = t + OTP_MINUTES * 60_000;

  await mutate((s) => {
    s.otps = s.otps.filter((o) => !(o.phone === phone && o.purpose === purpose) && Date.parse(o.expiresAt) > t - SEND_WINDOW_MS);
    s.otps.push({ phone, purpose, hash, expiresAt: new Date(expiresAt).toISOString(), attempts: 0, sends: [...recent, now()] });
  });

  const body = b64(JSON.stringify({ p: phone, h: hash, e: expiresAt, u: purpose } satisfies OtpCookie));
  const jar = await cookies();
  jar.set(OTP_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: OTP_MINUTES * 60,
  });

  const sms = await sendSms(phone, code);
  /* Showing the code on screen is only ever for a laptop. In production a
     code that could not be sent is a failure, never a code handed to
     whoever typed the number. */
  if (sms !== "sent" && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error: sms === "abroad"
        ? "For now we can send sign-in codes only to Indian mobile numbers. Sign in with an Indian number, or write to us and we will set you up."
        : "We could not send the code just now. Try again in a minute, or write to us.",
      phone,
    };
  }
  return { ok: true, phone, devCode: sms === "sent" ? null : code };
}

/** Check a code without deciding what it is for. */
async function checkOtp(rawPhone: string, rawCode: string, purpose: Purpose): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = rawPhone.trim();
  const code = rawCode.replace(/\D/g, "");
  if (!isAccountPhone(phone)) return { ok: false, error: "Ask for a new code — that one has expired." };

  const jar = await cookies();
  const otp = openSigned<OtpCookie>(jar.get(OTP_COOKIE)?.value);
  if (!otp || otp.p !== phone || (otp.u ?? "signin") !== purpose) return { ok: false, error: "Ask for a new code — that one has expired." };
  if (otp.e < Date.now()) return { ok: false, error: "That code has expired. Send a new one." };

  const d = await db();
  const row = d.otps.find((o) => o.phone === phone && o.purpose === purpose && o.hash === otp.h);
  if (row && row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many wrong tries on that code. Send yourself a new one." };

  if (otp.h !== otpHash(purpose, phone, code)) {
    const attempts = await mutate((s) => {
      let r = s.otps.find((o) => o.phone === phone && o.purpose === purpose && o.hash === otp.h);
      if (!r) {
        r = { phone, purpose, hash: otp.h, expiresAt: new Date(otp.e).toISOString(), attempts: 0, sends: [] };
        s.otps.push(r);
      }
      r.attempts += 1;
      return r.attempts;
    });
    const left = MAX_ATTEMPTS - attempts;
    return { ok: false, error: left > 0 ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries on that code. Send yourself a new one." };
  }

  jar.delete(OTP_COOKIE);
  await mutate((s) => { s.otps = s.otps.filter((o) => !(o.phone === phone && o.purpose === purpose)); });
  return { ok: true, phone };
}

export async function verifyOtp(rawPhone: string, rawCode: string, side: Side = "owner") {
  /* Owners sign in with Google now; a code is only ever an inspector's way in. */
  if (side !== "inspector") return { ok: false as const, error: "Owners sign in with Google." };
  /* The inspector door is shut to anyone off the roster — checked before
     the code is spent, and before any account is made. */
  if (side === "inspector" && !mayInspect(await db(), rawPhone.trim())) return { ok: false as const, error: NOT_ON_ROSTER };
  const res = await checkOtp(rawPhone, rawCode, "signin");
  if (!res.ok) return res;
  const { phone } = res;

  const d = await db();
  const isNew = !d.users.some((u) => u.phone === phone);

  /* One sign-in for everybody. An inspector's number is already on a
     row with role "inspector" — put there by an admin when they were
     verified — so the same six digits land them on /field instead. */
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.phone === phone);
    if (!u) {
      /* The launch offer is the first ten owners, in the order they
         arrive. Handing the number out here means it is decided once,
         at sign-up, rather than re-counted on every screen. */
      /* Only the inspector door creates an account here — never one of the
         ten launch owners. */
      u = {
        id: uid(), role: "owner", name: "", phone, email: "", livesIn: "",
        tz: "Asia/Kolkata", prefs: { sms: true, email: true },
        createdAt: now(), onboardedAt: null,
        foundingNo: null,
        freeVisitUsedAt: null, deletedAt: null,
      };
      s.users.push(u);
    }
    if (side === "inspector") ensureInspector(s, u);
    return u;
  });

  await openSession(user.id, side);
  return { ok: true as const, isNew, onboarded: !!user.onboardedAt, role: effectiveRole(user, side) };
}

/** Is this number allowed to ask for a code at the inspector door? */
export async function inspectorDoorOpen(phone: string) {
  return mayInspect(await db(), phone);
}

async function openSession(userId: string, side: Side) {
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  const jar = await cookies();
  jar.set(COOKIE, seal(userId, expiresAt, side), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
  });
}

/* ── owners: Google ─────────────────────────────────────────────── */

const OAUTH_COOKIE = "sy_oauth";
const OAUTH_MINUTES = 10;
type OAuthCookie = { s: string; v: string; e: number };

/** Remember one Google attempt's state and PKCE verifier, signed, for ten minutes. */
export async function rememberGoogleAttempt(state: string, verifier: string) {
  const body = b64(JSON.stringify({ s: state, v: verifier, e: Date.now() + OAUTH_MINUTES * 60_000 } satisfies OAuthCookie));
  (await cookies()).set(OAUTH_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: OAUTH_MINUTES * 60,
  });
}

/** The verifier for this state — once. Null when it does not match or has expired. */
export async function takeGoogleAttempt(state: string): Promise<string | null> {
  const jar = await cookies();
  const c = openSigned<OAuthCookie>(jar.get(OAUTH_COOKIE)?.value);
  jar.delete(OAUTH_COOKIE);
  if (!c || c.e < Date.now() || !state || c.s !== state) return null;
  return c.v;
}

/** Sign an owner in with the Google account Google just vouched for.
    Matched by Google's own id only — never by an email typed into a
    profile, which anyone could have typed. */
export async function signInWithGoogle(g: { sub: string; email: string; name: string }) {
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.googleSub === g.sub && !x.deletedAt);
    if (!u) {
      const taken = s.users.filter((x) => x.foundingNo !== null).length;
      u = {
        id: uid(), role: "owner", name: g.name, phone: "", email: g.email, googleSub: g.sub, contactPhone: "", livesIn: "",
        tz: "Asia/Kolkata", prefs: { sms: true, email: true },
        createdAt: now(), onboardedAt: null,
        foundingNo: taken < LIMIT ? taken + 1 : null,
        freeVisitUsedAt: null, deletedAt: null,
      };
      s.users.push(u);
    }
    return u;
  });
  await openSession(user.id, "owner");
  return user;
}

/** Development only: sign in as any owner by email, so a laptop without
    Google keys can still walk the owner app. Production never gets here. */
export async function devSignInOwner(email: string) {
  if (process.env.NODE_ENV === "production") return null;
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.email === email && !x.deletedAt);
    if (!u) {
      u = {
        id: uid(), role: "owner", name: "", phone: "", email, contactPhone: "", livesIn: "",
        tz: "Asia/Kolkata", prefs: { sms: true, email: true }, createdAt: now(), onboardedAt: null,
        foundingNo: null, freeVisitUsedAt: null, deletedAt: null,
      };
      s.users.push(u);
    }
    return u;
  });
  await openSession(user.id, "owner");
  return user;
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Safe to call from any server component.
    A closed account is nobody, even with a cookie that still verifies. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = unseal(token);
  if (!session) return null;
  const d = await db();
  const u = d.users.find((x) => x.id === session.u) ?? null;
  if (!u || u.deletedAt) return null;
  /* A copy, with the role this session is acting in. The stored role is
     only the default for sessions from before there were two doors. */
  return { ...u, role: effectiveRole(u, session.s) };
}

function effectiveRole(u: User, side: Side | undefined): User["role"] {
  if (u.role === "admin") return "admin";
  /* Only the roster is ever an inspector — a stored role or an older
     session without a side does not make anybody one. */
  if (side === "inspector" || (side === undefined && u.role === "inspector")) return canInspect(u) ? "inspector" : "owner";
  return "owner";
}

/** Where each kind of account lives. */
export const homeFor = (role: User["role"]) => (role === "inspector" ? "/field" : role === "admin" ? "/ops" : "/app");

/** Guard for everything under /app. Sends people to sign in, and new
    owners to the welcome flow, before any page body renders. */
export async function requireOwner(opts: { allowOnboarding?: boolean } = {}) {
  await sweepMissed();
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "owner") redirect(homeFor(user.role));
  /* A phone number is required — the inspector calls it from the door. */
  if ((!user.onboardedAt || !reachOn(user)) && !opts.allowOnboarding) redirect("/welcome");
  return user;
}

/** Guard for everything under /field. An inspector without a profile
    row has an account but no work yet — that is a real state, not an
    error, so it is handled by the page rather than bounced. */
export async function requireInspector() {
  await sweepMissed();
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "inspector") redirect(homeFor(user.role));
  return user;
}

/* ── ops: one page, one password ──────────────────────────────────
   The ops console is not an account. Whoever knows OPS_PASSWORD is ops,
   for twelve hours at a time, in a cookie signed like a session. The
   password lives in the environment, never in this repository.

   Six digits is only a million guesses, so wrong ones are braked twice:
   five per address in fifteen minutes, and thirty an hour from
   everybody together — per server instance, like the SMS brakes. An
   attack locks ops out for the hour too; that is the right way round. */
const OPS_COOKIE = "sy_ops";
const OPS_HOURS = 12;
const OPS_TRIES_PER_IP = 5;
const OPS_TRIES_ALL = 30;
const opsMisses = new Map<string, number[]>();
let opsMissesAll: number[] = [];

/** Null when the password was right and the cookie is set; otherwise why not. */
export async function opsSignIn(password: string): Promise<string | null> {
  const expected = process.env.OPS_PASSWORD;
  if (!expected) return "OPS_PASSWORD is not set on this server.";
  const ip = await clientIp();
  const t = Date.now();
  const mine = (opsMisses.get(ip) ?? []).filter((s) => t - s < 15 * 60_000);
  opsMissesAll = opsMissesAll.filter((s) => t - s < 60 * 60_000);
  if (mine.length >= OPS_TRIES_PER_IP || opsMissesAll.length >= OPS_TRIES_ALL) return "Too many wrong tries. Wait a while, then try again.";

  /* hashed first, so the comparison is the same length and constant-time */
  const same = timingSafeEqual(createHash("sha256").update(password).digest(), createHash("sha256").update(expected).digest());
  if (!same) {
    opsMisses.set(ip, [...mine, t]);
    opsMissesAll.push(t);
    return "That is not the password.";
  }
  const body = b64(JSON.stringify({ ops: 1, e: t + OPS_HOURS * 3_600_000 }));
  const jar = await cookies();
  jar.set(OPS_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production", maxAge: OPS_HOURS * 3600,
  });
  return null;
}

export async function isOps() {
  const jar = await cookies();
  const p = openSigned<{ ops?: number; e?: number }>(jar.get(OPS_COOKIE)?.value);
  return p?.ops === 1 && (p.e ?? 0) > Date.now();
}

export async function opsSignOut() {
  const jar = await cookies();
  jar.delete(OPS_COOKIE);
}

/** Guard for everything ops writes. The page itself shows the password
    form instead of bouncing anywhere. */
export async function requireAdmin() {
  if (!(await isOps())) redirect("/ops");
}
