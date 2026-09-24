import { NextRequest, NextResponse } from "next/server";
import { APPS_LIVE } from "@/lib/flags";
import { googleReady, identify } from "@/lib/google";
import { signInWithGoogle, takeGoogleAttempt } from "@/lib/auth";
import { reachOn } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Back from Google. The state must be the one this browser started with;
   then the code is traded for a verified identity, and the owner is in.
   A new owner — or one without a number yet — goes to the welcome flow,
   which asks for their phone before anything else. */
export async function GET(req: NextRequest) {
  if (!APPS_LIVE) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const origin = req.nextUrl.origin;
  const fail = (why: string) => NextResponse.redirect(`${origin}/signin?error=${why}`);
  if (!googleReady()) return fail("google-off");

  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return fail("google-cancelled");
  const verifier = await takeGoogleAttempt(sp.get("state") ?? "");
  const code = sp.get("code") ?? "";
  if (!verifier || !code) return fail("google-expired");

  try {
    const who = await identify(origin, code, verifier);
    const user = await signInWithGoogle(who);
    return NextResponse.redirect(`${origin}${user.onboardedAt && reachOn(user) ? "/app" : "/welcome"}`);
  } catch (err) {
    console.error(err);
    return fail("google-failed");
  }
}
