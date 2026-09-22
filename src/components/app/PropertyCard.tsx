import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight, CalendarDays, LandPlot, MapPin } from "lucide-react";
import { HealthRing } from "@/components/ui/HealthRing";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { StatusPill } from "@/components/app/ui";
import { fmtDate, relative } from "@/lib/format";
import { bhkLabel } from "@/lib/cleaning";
import { cn } from "@/lib/cn";
import type { PropertyView } from "@/lib/queries";

/** The card the whole app is really about: one property, its condition,
    and the single most useful thing to know about it right now. */
export function PropertyCard({ v }: { v: PropertyView }) {
  const { property: p, score, nextVisit, liveVisit, openIssues, lastReport } = v;

  return (
    <Link href={`/app/properties/${p.id}` as Route} className="group card block overflow-hidden border border-line bg-white shadow-card transition duration-500 hover:-translate-y-0.5 hover:shadow-float">
      <div className="relative">
        <EvidenceFrame variant={p.cover} id="" room={p.locality || p.city} time={lastReport ? fmtDate(lastReport.publishedAt) : "not yet visited"} tone={score === null ? undefined : score >= 70 ? "pass" : score >= 40 ? "attn" : "fail"} ratio="16 / 7" />
        {liveVisit && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold shadow-card">
            <span className="ping relative h-[6px] w-[6px] rounded-full bg-accent text-accent" />
            {liveVisit.status === "on_site" ? "Inspector on site" : liveVisit.status === "en_route" ? "On the way" : "Report being written"}
          </span>
        )}
      </div>

      <div className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em]">{p.label}</h3>
            <ArrowUpRight size={15} className="shrink-0 text-text-3 transition group-hover:text-accent" />
          </div>
          <div className="t-small mt-1 flex items-center gap-1.5">
            {p.kind === "plot" ? <LandPlot size={12} className="shrink-0" /> : <MapPin size={12} className="shrink-0" />}
            <span className="truncate">{p.address}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="chip">{p.kind === "plot" ? "Plot" : `${p.type} · ${bhkLabel[p.size]}`}</span>
            {openIssues.length > 0
              ? <span className={cn("chip", openIssues.some((i) => i.severity === "fail") ? "chip-fail" : "chip-warn")}>{openIssues.length} waiting on you</span>
              : score !== null && <span className="chip chip-pass">Nothing open</span>}
          </div>
        </div>

        {score !== null
          ? <HealthRing score={score} size={62} stroke={5.5} delay={0.1} />
          : <span className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full border border-dashed border-line-2 text-[11px] font-medium text-text-3">No visit<br />yet</span>}
      </div>

      <div className="flex items-center gap-2 border-t border-line px-5 py-3.5 text-[13px]">
        <CalendarDays size={13} className="shrink-0 text-text-3" />
        {nextVisit ? (
          <>
            <span className="text-text-2">Next visit {relative(nextVisit.scheduledFor)}</span>
            <span className="ml-auto"><StatusPill status={nextVisit.status} /></span>
          </>
        ) : liveVisit ? (
          <>
            <span className="text-text-2">Happening now</span>
            <span className="ml-auto"><StatusPill status={liveVisit.status} /></span>
          </>
        ) : (
          <span className="text-text-2">No visit scheduled — <span className="font-medium text-accent">book one</span></span>
        )}
      </div>
    </Link>
  );
}
