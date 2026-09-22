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

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, mutate, now, uid } from "@/lib/store";
import { LIMIT } from "@/lib/offer";
import type { User } from "@/lib/types";

const COOKIE = "sy_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;
const MAX_ATTEMPTS = 5;

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

export async function startOtp(rawPhone: string) {
  const phone = normalisePhone(rawPhone);
  if (!isPhone(phone)) return { ok: false as const, error: "That does not look like an Indian mobile number." };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60_000).toISOString();
  await mutate((d) => {
    d.otps = d.otps.filter((o) => o.phone !== phone);
    d.otps.push({ phone, code, expiresAt, attempts: 0 });
  });

  const sent = await sendSms(phone, code);
  return { ok: true as const, phone, devCode: sent ? null : code };
}

export async function verifyOtp(rawPhone: string, rawCode: string) {
  const phone = normalisePhone(rawPhone);
  const code = rawCode.replace(/\D/g, "");
  const d = await db();
  const otp = d.otps.find((o) => o.phone === phone);

  if (!otp) return { ok: false as const, error: "Ask for a new code — that one has expired." };
  if (new Date(otp.expiresAt) < new Date()) return { ok: false as const, error: "That code has expired. Send a new one." };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false as const, error: "Too many tries. Send a new code." };
  if (otp.code !== code) {
    await mutate((s) => { const o = s.otps.find((x) => x.phone === phone); if (o) o.attempts++; });
    return { ok: false as const, error: "That code is not right." };
  }

  /* One sign-in for everybody. An inspector's number is already on a
     row with role "inspector" — put there by an admin when they were
     verified — so the same six digits land them on /field instead. */
  const existing = d.users.find((u) => u.phone === phone);
  const isNew = !existing;
  const user = await mutate((s) => {
    s.otps = s.otps.filter((o) => o.phone !== phone);
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
  const id = uid();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await mutate((d) => {
    d.sessions = d.sessions.filter((s) => new Date(s.expiresAt) > new Date());
    d.sessions.push({ id, userId, createdAt: now(), expiresAt });
  });
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function signOut() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await mutate((d) => { d.sessions = d.sessions.filter((s) => s.id !== id); });
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Safe to call from any server component. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const d = await db();
  const session = d.sessions.find((s) => s.id === id);
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return d.users.find((u) => u.id === session.userId) ?? null;
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
