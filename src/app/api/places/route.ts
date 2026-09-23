import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { APPS_LIVE } from "@/lib/flags";
import { allow, OlaError, placePoint, searchPlaces, searchReady, whatIsHere } from "@/lib/ola";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* The pin picker's one way to Ola.
     ?q=…          address suggestions
     ?place=…      where a suggestion is, when it came without a point
     ?lat=…&lng=…  what is at a spot
   Signed-in people only, each with their own ceiling — see lib/ola. */
export async function GET(req: NextRequest) {
  if (!APPS_LIVE) return fail("Not found.", 404);
  const user = await currentUser();
  if (!user) return fail("Sign in first.", 401);
  if (!searchReady()) return fail("Address search is not set up.", 503);
  if (!allow(user.id)) return fail("That is a lot of searching — give it a minute.", 429);

  const sp = req.nextUrl.searchParams;
  const site = req.nextUrl.origin;
  try {
    const q = (sp.get("q") ?? "").trim();
    if (q) {
      if (q.length < 3 || q.length > 120) return fail("Type at least three letters.", 400);
      return NextResponse.json({ results: await searchPlaces(q, site) });
    }

    const place = (sp.get("place") ?? "").trim();
    if (place) {
      if (place.length > 200) return fail("That place is not one we know.", 400);
      return NextResponse.json({ point: await placePoint(place, site) });
    }

    const lat = Number(sp.get("lat")), lng = Number(sp.get("lng"));
    if (sp.has("lat") && sp.has("lng") && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return NextResponse.json({ here: await whatIsHere(lat, lng, site) });
    }
    return fail("Ask for a search, a place, or a spot.", 400);
  } catch (err) {
    if (err instanceof OlaError && err.kind === "busy") return fail("The map service is busy — try again in a minute.", 429);
    console.error("[places]", err);
    return fail("The map service did not answer.", 502);
  }
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
