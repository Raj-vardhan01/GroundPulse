import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Info, LayoutGrid, MapPin, Navigation } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, liveJob, openJobs, doneJobs, STATUS_COPY, CAN_WORK } from "@/lib/field";
import { JobCard, JobTags } from "@/components/field/JobCard";
import { Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, relative } from "@/lib/format";
import { fmtKm } from "@/lib/geo";
import { cn } from "@/lib/cn";

export default async function Today() {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const copy = STATUS_COPY[ins.status];
  const canWork = CAN_WORK.includes(ins.status);

  const [live, board, done] = await Promise.all([liveJob(ins), openJobs(ins, "near"), doneJobs(ins)]);
  const first = ins.name.split(" ")[0];
  const hour = new Date().getHours();

  return (
    <div className="grid gap-4">
      <Reveal>
        <div>
          <p className="t-label">{hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, {first}</p>
          <h1 className="serif mt-1 text-[clamp(1.7rem,6vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">
            {live ? "You have a job open." : canWork ? `${board.length} job${board.length === 1 ? "" : "s"} on the board.` : "Nothing to do yet."}
          </h1>
        </div>
      </Reveal>

      {/* where they are in the gauntlet — never hidden */}
      {ins.status !== "active" && (
        <Reveal delay={0.04}>
          <div className={cn("card border p-4", copy.tone === "fail" ? "border-fail/30 bg-fail-soft" : "border-warn/30 bg-warn-soft")}>
            <div className="flex items-start gap-3">
              <Info size={16} className={cn("mt-0.5 shrink-0", copy.tone === "fail" ? "text-fail" : "text-warn")} />
              <div className="grow basis-[14rem]">
                <div className="text-[14.5px] font-semibold text-ink">{copy.label}</div>
                <p className="mt-1 text-[13.5px] leading-snug text-text-2">{copy.note}</p>
                {ins.status === "probation" && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[12.5px] font-medium">
                      <span>Reports reviewed</span><span className="tabular-nums">{Math.min(ins.reviewedReports, 5)} of 5</span>
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < ins.reviewedReports ? "bg-warn" : "bg-white/70")} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* the one job they are holding */}
      {live ? (
        <Reveal delay={0.06}>
          <div className="on-dark card bg-ink p-5 shadow-float sm:p-6">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 text-white"><ClipboardList size={19} /></span>
              <div className="grow basis-[14rem]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  {live.visit.status === "assigned" ? "Claimed" : live.visit.status === "en_route" ? "On the way" : live.visit.status === "on_site" ? "On site" : "Submitted"}
                </p>
                <h2 className="mt-1 text-[20px] font-medium tracking-[-0.025em] text-white">{live.property.label}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-white/65"><MapPin size={12} /> {live.property.address}</p>
                <p className="mt-0.5 text-[13.5px] text-white/65">{fmtDayDate(live.visit.scheduledFor)} · {live.visit.slot} · {fmtKm(live.km)} away</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[20px] font-semibold tabular-nums text-white">{money(live.visit.payoutInr)}</div>
                <div className="text-[12px] text-white/55">you earn</div>
              </div>
            </div>
            <div className="mt-4"><JobTags j={live} /></div>
            <Link href={`/field/visit/${live.visit.id}` as Route} className="btn btn-white mt-4 w-full">
              {live.visit.status === "on_site" ? "Continue the checklist" : "Open this job"} <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      ) : canWork ? (
        <>
          <Reveal delay={0.06}>
            <div className="card flex flex-wrap items-center gap-3 border border-accent/20 bg-accent-tint p-4">
              <Navigation size={17} className="shrink-0 text-accent" />
              <p className="grow basis-[14rem] text-[14px] leading-snug text-accent-2">
                Nothing open. Take one job at a time — finish it, and the board comes back.
              </p>
              <Link href="/field/jobs" className="btn btn-pill btn-sm shrink-0 border-accent/20"><LayoutGrid size={14} /> See the board</Link>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel>
              <PanelHead title="Closest to you" meta={`${ins.baseLocality} · ${ins.city}`} action={<Link href="/field/jobs" className="btn btn-pill btn-sm">All {board.length}</Link>} />
              <div className="grid gap-3 p-4">
                {board.length === 0
                  ? <p className="t-small py-6 text-center">No open jobs in {ins.city} right now. We will message you when one lands.</p>
                  : board.slice(0, 3).map((j) => <JobCard key={j.visit.id} j={j} href={`/field/jobs/${j.visit.id}`} />)}
              </div>
            </Panel>
          </Reveal>
        </>
      ) : null}

      <Reveal delay={0.1}>
        <div className="grid grid-cols-3 gap-2">
          <Stat n={done.length} l="Visits done" className="border border-line bg-white shadow-card" />
          <Stat n={ins.rating} l="Your rating" tone="accent" className="border border-line bg-white shadow-card" />
          <Stat n={money(ins.depositInr)} l="Deposit held" className="border border-line bg-white shadow-card" />
        </div>
      </Reveal>

      {done.length > 0 && (
        <Reveal delay={0.12}>
          <Panel>
            <PanelHead title="Recently done" meta={`${done.length} on record`} />
            <ul className="divide-y divide-line">
              {done.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                  <CheckCircle2 size={16} className="shrink-0 text-pass" />
                  <div className="grow basis-[10rem]">
                    <div className="text-[14px] font-medium">{v.ref}</div>
                    <div className="t-small flex items-center gap-1.5"><CalendarDays size={11} /> {fmtDayDate(v.scheduledFor)} · {relative(v.scheduledFor)}</div>
                  </div>
                  <span className="shrink-0 text-[14px] font-medium tabular-nums">{money(v.payoutInr)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      )}
    </div>
  );
}
