import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Bike, CalendarClock, IndianRupee, Lock, MapPinned } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, heldJobs, openJobs, CAN_WORK, STATUS_COPY, type Sort } from "@/lib/field";
import { HOLD, holdMax, PENALTY } from "@/lib/jobs";
import { DEPOSIT } from "@/lib/payout";
import { inr } from "@/lib/pricing";
import { JobCard } from "@/components/field/JobCard";
import { Empty, Panel } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export const metadata = { title: "Board" };

const SORTS: { k: Sort; label: string; I: typeof Bike }[] = [
  { k: "near", label: "Nearest", I: Bike },
  { k: "soon", label: "Soonest", I: CalendarClock },
  { k: "pay", label: "Pays most", I: IndianRupee },
];

export default async function Board({ searchParams }: PageProps<"/field/jobs">) {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const sp = await searchParams;
  const sort = (SORTS.some((s) => s.k === sp.sort) ? sp.sort : "near") as Sort;

  const [jobs, held] = await Promise.all([openJobs(ins, sort), heldJobs(ins)]);
  const canWork = CAN_WORK.includes(ins.status);
  const max = holdMax(ins);

  return (
    <div className="grid gap-4">
      <div>
        <p className="t-label flex items-center gap-1.5"><MapPinned size={13} /> {ins.city} · you start from {ins.baseLocality}</p>
        <h1 className="serif mt-1 text-[clamp(1.7rem,6vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">The board</h1>
        <p className="t-small mt-1.5">Every unclaimed job in your city and 20 km past it. Hold up to {max}{max < HOLD.max ? ` until ${inr(DEPOSIT.unlock)} of your deposit is in (${HOLD.max} after)` : ""}, {HOLD.perDay} a day, one per window — hand one back free until {PENALTY.freeReleaseHours} hours before.</p>
      </div>

      {!canWork && (
        <div className="card border border-warn/30 bg-warn-soft p-4">
          <div className="flex items-start gap-3">
            <Lock size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-[13.5px] leading-snug text-text-2">{STATUS_COPY[ins.status].note}</p>
          </div>
        </div>
      )}

      {held.length > 0 && (
        <Reveal>
          <Link href="/field" className="card flex flex-wrap items-center gap-3 border border-accent/25 bg-accent-tint p-4 transition hover:shadow-card">
            <Lock size={16} className="shrink-0 text-accent" />
            <p className="grow basis-[14rem] text-[13.5px] leading-snug text-accent-2">
              You are holding <b>{held.length} of {max}</b>{held.length >= max ? " — finish one or hand one back to claim more." : "."}
            </p>
            <span className="btn btn-pill btn-sm shrink-0 border-accent/20">Your jobs <ArrowRight size={14} /></span>
          </Link>
        </Reveal>
      )}

      <div className="hscroll -mx-1 px-1">
        {SORTS.map(({ k, label, I }) => (
          <Link key={k} href={(k === "near" ? "/field/jobs" : `/field/jobs?sort=${k}`) as Route}
            className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition",
              sort === k ? "bg-accent text-white" : "bg-white text-text-2 shadow-card")}>
            <I size={14} /> {label}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <Panel>
          <Empty icon={MapPinned} title={`No open jobs in ${ins.city}.`}
            body="Everything going has been claimed. We message you the moment a new one is booked in your city." />
        </Panel>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j, i) => (
            <Reveal key={j.visit.id} delay={Math.min(0.04 * i, 0.2)}>
              <JobCard j={j} href={`/field/jobs/${j.visit.id}`} />
            </Reveal>
          ))}
        </div>
      )}

      <p className="t-small px-1 pb-2">
        Jobs are shown for {ins.city} only. Distances are measured from {ins.baseLocality} to the locality centre, so treat them as a guide, not a route.
      </p>
    </div>
  );
}
