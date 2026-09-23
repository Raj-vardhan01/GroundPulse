import Link from "next/link";
import type { Route } from "next";
import { Bike, CalendarDays, Camera, Car, ClipboardList, LandPlot, MapPin, Sparkles, Video } from "lucide-react";
import { fmtDayDate, relative } from "@/lib/format";
import { fmtKm } from "@/lib/geo";
import { bhkLabel } from "@/lib/cleaning";
import { cn } from "@/lib/cn";
import type { JobView } from "@/lib/field";

const money = (n: number) => "₹" + n.toLocaleString("en-IN");

const kindLabel = (j: JobView) =>
  j.visit.kind === "plot" ? "Plot walk" : j.visit.kind === "cleaning" ? "Clean · supervise" : "Inspection";

/** The little row of things that change what the job actually involves. */
export function JobTags({ j }: { j: JobView }) {
  const a = j.visit.addOns;
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip">{j.visit.kind === "plot" ? "Plot" : `${j.property.type || "Home"} · ${bhkLabel[j.property.size]}`}</span>
      {j.visit.kind !== "plot" && <span className="chip"><ClipboardList size={10} className="mr-0.5" />{j.items} items</span>}
      {(a.cleaning || a.deep) && <span className="chip chip-warn"><Sparkles size={10} className="mr-0.5" />Clean on site</span>}
      {!!a.car && <span className="chip"><Car size={10} className="mr-0.5" />{a.car} car</span>}
      {!!a.camera && <span className="chip chip-accent"><Camera size={10} className="mr-0.5" />Body cam</span>}
      {j.visit.liveCall && <span className="chip chip-accent"><Video size={10} className="mr-0.5" />Live call</span>}
    </div>
  );
}

export function JobCard({ j, href, showDistance = true }: { j: JobView; href: string; showDistance?: boolean }) {
  return (
    <Link href={href as Route} className="card block border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex items-start gap-3">
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]",
          j.visit.kind === "plot" ? "bg-warn-soft text-warn" : "bg-accent-tint text-accent")}>
          {j.visit.kind === "plot" ? <LandPlot size={18} /> : <ClipboardList size={18} />}
        </span>
        <div className="grow basis-[12rem]">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold tracking-[-0.015em]">{j.property.locality || j.property.city}</span>
            <span className="t-small">· {kindLabel(j)}</span>
          </div>
          <div className="t-small mt-0.5 flex items-center gap-1.5"><MapPin size={12} className="shrink-0" /> {j.property.address}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[17px] font-semibold tabular-nums">{money(j.visit.payoutInr)}</div>
          <div className="t-small">you earn</div>
        </div>
      </div>

      <div className="mt-3">
        <JobTags j={j} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[13px] text-text-2">
        <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {fmtDayDate(j.visit.scheduledFor)} · {j.visit.slot}</span>
        {showDistance && <span className="flex items-center gap-1.5"><Bike size={12} /> {fmtKm(j.km)} · about {j.minutes} min</span>}
        <span className="ml-auto text-text-3">{relative(j.visit.scheduledFor)}</span>
      </div>
    </Link>
  );
}
