/* ════════════════════════════════════════════════════════════════
   "Continue with Google" for owners — OAuth 2.0 with PKCE, by hand.

     GOOGLE_CLIENT_ID      from Google Cloud → APIs & Services →
     GOOGLE_CLIENT_SECRET  Credentials → OAuth client ID (Web application)

   Authorised redirect URIs to register on that client:
     https://stillyours.in/api/auth/google/callback
     https://www.stillyours.in/api/auth/google/callback
     http://localhost:61132/api/auth/google/callback   (for a laptop)

   The ID token comes straight from Google's token endpoint over TLS, so
   — as OpenID Connect allows — its issuer, audience, expiry and verified
   email are checked rather than its signature.
   ════════════════════════════════════════════════════════════════ */

import { createHash, randomBytes } from "node:crypto";

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

const clientId = () => process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

export const googleReady = () => !!clientId() && !!clientSecret();

export const redirectUri = (origin: string) => `${origin}/api/auth/google/callback`;

const b64url = (b: Buffer) => b.toString("base64url");

/** A fresh state and PKCE pair for one sign-in attempt. */
export function newAttempt() {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { state, verifier, challenge };
}

export function authUrl(origin: string, state: string, challenge: string) {
  const q = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTH}?${q}`;
}

export type GoogleIdentity = { sub: string; email: string; name: string };

/** Trade the code for who they are. Throws on anything unexpected. */
export async function identify(origin: string, code: string, verifier: string): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, code_verifier: verifier, client_id: clientId(), client_secret: clientSecret(),
      redirect_uri: redirectUri(origin), grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`[google] token exchange failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  const payload = id_token?.split(".")[1];
  if (!payload) throw new Error("[google] no id_token");
  const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean; name?: string;
  };
  if (!c.iss || !ISSUERS.includes(c.iss)) throw new Error("[google] wrong issuer");
  if (c.aud !== clientId()) throw new Error("[google] wrong audience");
  if (!c.exp || c.exp * 1000 < Date.now()) throw new Error("[google] expired token");
  if (!c.sub || !c.email || c.email_verified !== true) throw new Error("[google] no verified email");
  return { sub: c.sub, email: c.email.toLowerCase(), name: (c.name ?? "").trim().slice(0, 120) };
}
