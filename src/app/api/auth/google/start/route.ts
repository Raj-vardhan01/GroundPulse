import { NextRequest, NextResponse } from "next/server";
import { APPS_LIVE } from "@/lib/flags";
import { authUrl, googleReady, newAttempt } from "@/lib/google";
import { rememberGoogleAttempt } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* "Continue with Google": remember this attempt, then off to Google. */
export async function GET(req: NextRequest) {
  if (!APPS_LIVE) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const origin = req.nextUrl.origin;
  if (!googleReady()) return NextResponse.redirect(`${origin}/signin?error=google-off`);
  const { state, verifier, challenge } = newAttempt();
  await rememberGoogleAttempt(state, verifier);
  return NextResponse.redirect(authUrl(origin, state, challenge));
}
