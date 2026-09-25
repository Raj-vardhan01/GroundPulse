/* ════════════════════════════════════════════════════════════════
   Who may open the inspector app: these numbers, and nobody else.

   There is no admin panel yet, so the roster is written here. A number
   not on it is refused at the inspector door before any code is sent —
   whatever its stored role, and whatever an older session says.

   The same number can be an owner too. Which app it opens is chosen at
   the door (the sign-in page) and carried in the session, not stored on
   the person.
   ════════════════════════════════════════════════════════════════ */

import { HOME_CITY } from "@/lib/city";
import { todayKey } from "@/lib/format";
import { uid } from "@/lib/store";
import type { DB, Inspector, User } from "@/lib/types";

/** Ten-digit Indian mobiles, as they are stored. */
export const ROSTER: readonly string[] = ["7470954890", "8640007601"];

/* On a laptop the three demo inspectors are on the roster too — their jobs
   are in the demo data, and without them the inspector app has nothing to
   show. Production never has demo data and never takes these numbers. */
const DEMO_INSPECTORS: readonly string[] = ["9000000001", "9000000002", "9000000003"];
const onRoster = (phone: string) =>
  ROSTER.includes(phone) || (process.env.NODE_ENV !== "production" && DEMO_INSPECTORS.includes(phone));

export const canInspect = (u: Pick<User, "phone">) => onRoster(u.phone);

/** Before an account exists: may this number use the inspector door? */
export const mayInspect = (_d: DB, phone: string) => onRoster(phone);

export const NOT_ON_ROSTER =
  "This number is not on our verified inspector list. Inspectors are added by StillYours after an in-person check — if you applied, we will call you.";

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "SY";

/** Give a rostered person their inspector record the first time they
    come through the inspector door. They are the founders for now, so
    they start active — nobody else can read their reports first. Name
    and UPI are asked for on their first screen. */
export function ensureInspector(d: DB, user: User): Inspector {
  const have = d.inspectors.find((i) => i.userId === user.id);
  if (have) return have;
  const ins: Inspector = {
    id: uid(), userId: user.id, name: user.name, initials: initialsOf(user.name), phone: user.phone,
    area: HOME_CITY, city: HOME_CITY, baseLocality: "", areas: [],
    rating: 5, visits: 0, since: todayKey().slice(0, 4), bg: "StillYours founding inspector",
    verified: true, status: "active", docs: [], depositInr: 0, availability: [], reviewedReports: 5,
    upiId: "",
  };
  d.inspectors.push(ins);
  return ins;
}

export { initialsOf };
