/* ════════════════════════════════════════════════════════════════
   Phone-OTP sign-in.

   An owner is often abroad on a foreign SIM, so any country's mobile
   works (see lib/phone) and the session lives in an httpOnly cookie
   for 30 days — long, because the whole point is opening the app at
   11 PM in another country without hunting for a password.

   Locally there is no SMS gateway, so the code is returned to the
   caller and shown on screen, clearly marked. Wire `sendSms` to
   MSG91 or Twilio and that stops happening on its own.
   ════════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, mutate, now, uid } from "@/lib/store";
import { LIMIT } from "@/lib/offer";
import { isAccountPhone, parsePhone } from "@/lib/phone";
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

async function ipAllowed() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
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

/** `<payload>.<signature>` — unreadable to nobody, unforgeable to everybody. */
function seal(userId: string, expiresAt: number) {
  const body = b64(JSON.stringify({ u: userId, e: expiresAt }));
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

function unseal(token: string): { u: string; e: number } | null {
  const payload = openSigned<{ u: string; e: number }>(token);
  if (!payload?.u || payload.e < Date.now()) return null;
  return payload;
}

/** The one seam a real SMS provider slots into. */
async function sendSms(phone: string, code: string) {
  if (!process.env.SMS_PROVIDER_KEY) return false;
  // MSG91 / Twilio call goes here. Until then the caller shows the code.
  console.log(`[auth] would SMS ${phone}: ${code}`);
  return false;
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

  const sent = await sendSms(phone, code);
  /* Showing the code on screen is only ever for a laptop. In production a
     code that could not be sent is a failure, never a code handed to
     whoever typed the number. */
  if (!sent && process.env.NODE_ENV === "production") {
    return { ok: false, error: "We could not send the code just now. Try again in a minute, or write to us.", phone };
  }
  return { ok: true, phone, devCode: sent ? null : code };
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

export async function verifyOtp(rawPhone: string, rawCode: string) {
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
      const taken = s.users.filter((x) => x.foundingNo !== null).length;
      u = {
        id: uid(), role: "owner", name: "", phone, email: "", livesIn: "",
        tz: "Asia/Kolkata", prefs: { sms: true, email: true },
        createdAt: now(), onboardedAt: null,
        foundingNo: taken < LIMIT ? taken + 1 : null,
        freeVisitUsedAt: null, deletedAt: null,
      };
      s.users.push(u);
    }
    return u;
  });

  await openSession(user.id);
  return { ok: true as const, isNew, onboarded: !!user.onboardedAt, role: user.role };
}

/** Move a signed-in account onto a new number, once the new number has
    proved it is theirs. */
export async function changePhone(userId: string, rawPhone: string, rawCode: string) {
  const res = await checkOtp(rawPhone, rawCode, "change");
  if (!res.ok) return res;
  const taken = (await db()).users.some((u) => u.phone === res.phone && u.id !== userId);
  if (taken) return { ok: false as const, error: "That number already has an account. Sign in with it instead." };
  await mutate((s) => {
    const u = s.users.find((x) => x.id === userId);
    if (u) u.phone = res.phone;
  });
  return { ok: true as const, phone: res.phone };
}

/** Is this number free to move an account onto? Checked before a code is
    sent, so nobody is sent a code they cannot use. */
export async function phoneTaken(phone: string, exceptUserId: string) {
  return (await db()).users.some((u) => u.phone === phone && u.id !== exceptUserId);
}

async function openSession(userId: string) {
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  const jar = await cookies();
  jar.set(COOKIE, seal(userId, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
  });
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
  return u && !u.deletedAt ? u : null;
}

/** Where each kind of account lives. */
export const homeFor = (role: User["role"]) => (role === "inspector" ? "/field" : role === "admin" ? "/ops" : "/app");

/** Guard for everything under /app. Sends people to sign in, and new
    owners to the welcome flow, before any page body renders. */
export async function requireOwner(opts: { allowOnboarding?: boolean } = {}) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "owner") redirect(homeFor(user.role));
  if (!user.onboardedAt && !opts.allowOnboarding) redirect("/welcome");
  return user;
}

/** Guard for everything under /field. An inspector without a profile
    row has an account but no work yet — that is a real state, not an
    error, so it is handled by the page rather than bounced. */
export async function requireInspector() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "inspector") redirect(homeFor(user.role));
  return user;
}

/** Guard for the ops console. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "admin") redirect(homeFor(user.role));
  return user;
}
