/* ════════════════════════════════════════════════════════════════
   Phone-OTP sign-in.

   An owner is often abroad on a foreign SIM, so the code is sent to
   whatever number they give and the session lives in an httpOnly
   cookie for 30 days — long, because the whole point is opening the
   app at 11 PM in another country without hunting for a password.

   Locally there is no SMS gateway, so the code is returned to the
   caller and shown on screen, clearly marked. Wire `sendSms` to
   MSG91 or Twilio and that stops happening on its own.
   ════════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, mutate, now, uid } from "@/lib/store";
import { LIMIT } from "@/lib/offer";
import type { User } from "@/lib/types";

const COOKIE = "sy_session";
const OTP_COOKIE = "sy_otp";
const SESSION_DAYS = 30;

/* The session lives in the cookie itself, signed — not as an id looked
   up in a table.

   A stored session needs every server that might answer a request to
   see the same store. On a serverless host they do not: each instance
   has its own memory, so an owner who signed in on one instance was a
   stranger to the next and got thrown back to the sign-in page
   mid-booking. A signed cookie any instance can verify removes the
   lookup entirely — and it is the same shape a real deployment uses,
   so none of this is throwaway. */
const SECRET =
  process.env.SESSION_SECRET ||
  // Fine locally, where the only person holding a cookie is you. In
  // production set SESSION_SECRET; without it a redeploy changes the
  // key and signs everybody out, which is the safe way to fail.
  "stillyours-dev-secret-not-for-production";

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64url");

/** `<payload>.<signature>` — unreadable to nobody, unforgeable to everybody. */
function seal(userId: string, expiresAt: number) {
  const body = b64(JSON.stringify({ u: userId, e: expiresAt }));
  return `${body}.${sign(body)}`;
}

function unseal(token: string): { u: string; e: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  /* Constant-time, so the comparison cannot be used to guess a signature
     one character at a time. */
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(unb64(body)) as { u: string; e: number };
    if (!payload.u || payload.e < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
const OTP_MINUTES = 10;

/** Digits only, so "+91 90000 00000" and "9000000000" are one person. */
export const normalisePhone = (raw: string) => raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
export const prettyPhone = (p: string) => (p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p);
export const isPhone = (p: string) => /^[6-9]\d{9}$/.test(p);

/** The one seam a real SMS provider slots into. */
async function sendSms(phone: string, code: string) {
  if (!process.env.SMS_PROVIDER_KEY) return false;
  // MSG91 / Twilio call goes here. Until then the caller shows the code.
  console.log(`[auth] would SMS ${phone}: ${code}`);
  return false;
}

/* The pending code travels in its own short-lived cookie rather than in
   the store, for the same reason the session does: the instance that
   sends the code is not necessarily the one that checks it, and an
   owner should not be told their code expired because their second
   request landed somewhere else.

   Only an HMAC of the code is in the cookie, so reading it — even your
   own — tells you nothing without the server's secret. */
const otpHash = (phone: string, code: string) => sign(`${phone}:${code}`);

export async function startOtp(rawPhone: string) {
  const phone = normalisePhone(rawPhone);
  if (!isPhone(phone)) return { ok: false as const, error: "That does not look like an Indian mobile number." };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const body = b64(JSON.stringify({ p: phone, h: otpHash(phone, code), e: Date.now() + OTP_MINUTES * 60_000 }));
  const jar = await cookies();
  jar.set(OTP_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: OTP_MINUTES * 60,
  });

  const sent = await sendSms(phone, code);
  return { ok: true as const, phone, devCode: sent ? null : code };
}

function openOtp(token: string | undefined): { p: string; h: string; e: number } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(unb64(body)) as { p: string; h: string; e: number };
  } catch {
    return null;
  }
}

export async function verifyOtp(rawPhone: string, rawCode: string) {
  const phone = normalisePhone(rawPhone);
  const code = rawCode.replace(/\D/g, "");
  const jar = await cookies();
  const otp = openOtp(jar.get(OTP_COOKIE)?.value);

  if (!otp || otp.p !== phone) return { ok: false as const, error: "Ask for a new code — that one has expired." };
  if (otp.e < Date.now()) return { ok: false as const, error: "That code has expired. Send a new one." };
  if (otp.h !== otpHash(phone, code)) return { ok: false as const, error: "That code is not right." };

  jar.delete(OTP_COOKIE);

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
        createdAt: now(), onboardedAt: null,
        foundingNo: taken < LIMIT ? taken + 1 : null,
        freeVisitUsedAt: null,
      };
      s.users.push(u);
    }
    return u;
  });

  await openSession(user.id);
  return { ok: true as const, isNew, onboarded: !!user.onboardedAt, role: user.role };
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

/** The signed-in user, or null. Safe to call from any server component. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = unseal(token);
  if (!session) return null;
  const d = await db();
  return d.users.find((u) => u.id === session.u) ?? null;
}

/** Guard for everything under /app. Sends people to sign in, and new
    owners to the welcome flow, before any page body renders. */
export async function requireOwner(opts: { allowOnboarding?: boolean } = {}) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role === "inspector") redirect("/field");
  if (user.role !== "owner") redirect("/signin");
  if (!user.onboardedAt && !opts.allowOnboarding) redirect("/welcome");
  return user;
}

/** Guard for everything under /field. An inspector without a profile
    row has an account but no work yet — that is a real state, not an
    error, so it is handled by the page rather than bounced. */
export async function requireInspector() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role === "owner") redirect("/app");
  if (user.role !== "inspector") redirect("/signin");
  return user;
}
