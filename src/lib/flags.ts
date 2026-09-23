/* ════════════════════════════════════════════════════════════════
   One switch for the signed-in apps.

   The owner and inspector apps are finished enough to build against
   but not finished enough to hand to a stranger, and the marketing
   site is already serving real visitors. So in production they are
   off: the links are not rendered, and the routes themselves return
   a 404 rather than a sign-in form nobody should be filling in.

   Locally they are always on — that is where the work happens.

   To put them live: set NEXT_PUBLIC_APPS_LIVE=1 in Vercel and
   redeploy. Nothing else needs touching.
   ════════════════════════════════════════════════════════════════ */

export const APPS_LIVE =
  process.env.NEXT_PUBLIC_APPS_LIVE === "1" || process.env.NODE_ENV !== "production";
