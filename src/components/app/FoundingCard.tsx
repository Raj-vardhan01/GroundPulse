import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Check, Gift } from "lucide-react";
import { hasFreeVisit, qualifies, terms, LIMIT } from "@/lib/offer";
import { fmtDate } from "@/lib/format";
import type { User, Property } from "@/lib/types";
import { cn } from "@/lib/cn";

/* The launch offer, inside the account. It states which of *your*
   properties it actually covers — a term list that does not name the
   property is the kind of small print people feel cheated by later. */
export function FoundingCard({ user, properties, compact = false }: { user: User; properties: Property[]; compact?: boolean }) {
  if (user.foundingNo === null || user.foundingNo > LIMIT) return null;

  const open = hasFreeVisit(user);
  const qualifying = properties.filter(qualifies);

  if (!open) {
    return (
      <section className="card border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pass-soft text-pass"><Check size={17} strokeWidth={3} /></span>
          <div className="grow basis-[15rem]">
            <div className="text-[15px] font-semibold">Free inspection used</div>
            <div className="t-small mt-0.5">
              Owner #{user.foundingNo} of our first {LIMIT} · claimed {user.freeVisitUsedAt ? fmtDate(user.freeVisitUsedAt, { year: true }) : ""}
            </div>
          </div>
          <Link href="/app/book" className="btn btn-pill btn-sm shrink-0">Book another visit</Link>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("on-dark card bg-ink shadow-float", compact ? "p-5" : "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 text-white"><Gift size={19} /></span>
        <div className="grow basis-[15rem]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Launch offer · owner #{user.foundingNo} of {LIMIT}</p>
          <h2 className="serif mt-1.5 text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.08] tracking-[-0.03em] text-white">
            Your first inspection is free.
          </h2>
          <p className="mt-2 max-w-[48ch] text-[14.5px] leading-relaxed text-white/70">
            {qualifying.length
              ? <>It covers {qualifying.map((p) => p.label).join(", ")} — the full 42-item check, photos and video of every room, and the body camera thrown in.</>
              : <>It covers a home up to 2 BHK in Bengaluru. Add one and the visit costs you nothing.</>}
          </p>
        </div>
        <Link
          href={(qualifying.length ? `/app/book?property=${qualifying[0].id}&plan=one-time` : "/app/properties/new") as Route}
          className="btn btn-white btn-sm shrink-0"
        >
          {qualifying.length ? "Book it free" : "Add a property"} <ArrowRight size={15} />
        </Link>
      </div>

      {!compact && (
        <ul className="mt-5 grid gap-2 border-t border-white/12 pt-5 sm:grid-cols-2">
          {terms.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/75">
              <span className="mt-[3px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={10} strokeWidth={3} /></span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
