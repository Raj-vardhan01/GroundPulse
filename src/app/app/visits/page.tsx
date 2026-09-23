import Link from "next/link";
import type { Route } from "next";
import { BadgeCheck, CalendarDays, Plus } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { visits, properties, inspectorsById, openableReports, isOverdue } from "@/lib/queries";
import { Empty, PageHead, Panel, PanelHead, StatusPill, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, relative } from "@/lib/format";
import type { Inspector, Property, Visit } from "@/lib/types";

export const metadata = { title: "Visits" };

const kindLabel = (k: Visit["kind"]) => (k === "cleaning" ? "Cleaning" : k === "plot" ? "Plot visit" : "Inspection");

function VisitRows({ rows, props, inspectors, openable }: { rows: Visit[]; props: Property[]; inspectors: Record<string, Inspector>; openable: Set<string> }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((v) => {
        const ins = inspectors[v.inspectorId];
        const [, mm, dd] = v.scheduledFor.split("-").map(Number);
        /* A report still with the reviewer is not the owner's to open yet —
           the visit page says so instead of a 404. */
        const href = v.reportId && openable.has(v.reportId) ? `/app/reports/${v.reportId}` : `/app/visits/${v.id}`;
        return (
          <li key={v.id}>
            <Link href={href as Route} className="flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-paper text-center leading-none">
                <span className="block font-mono text-[15px] font-semibold tabular-nums">{dd}</span>
                <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.06em] text-text-3">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mm - 1]}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-medium">{props.find((p) => p.id === v.propertyId)?.label ?? "Property"}</div>
                <div className="t-small mt-0.5 truncate">
                  {fmtDayDate(v.scheduledFor)} · {v.slot} · {kindLabel(v.kind)}{ins ? ` · ${ins.name}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {isOverdue(v) ? <span className="chip chip-warn">Needs a new day</span> : <StatusPill status={v.status} />}
                <div className="t-small mt-1">
                  {v.status === "cancelled" ? "₹0" : v.founding ? "Free" : v.amountInr ? money(v.amountInr) : "On your plan"}
                  {ins && <BadgeCheck size={11} className="ml-1 inline -translate-y-px text-accent" />}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function Page() {
  const user = await requireOwner();
  const [all, props, inspectors, openable] = await Promise.all([visits(user.id), properties(user.id), inspectorsById(), openableReports(user.id)]);

  const upcoming = all.filter((v) => !["ready", "closed", "cancelled"].includes(v.status)).sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
  const past = all.filter((v) => ["ready", "closed", "cancelled"].includes(v.status));

  return (
    <>
      <PageHead
        eyebrow="Your calendar"
        title="Visits"
        lede="Everything booked, everything walked. A visit becomes a report within the hour of the inspector leaving."
        action={<Link href="/app/book" className="btn btn-accent btn-sm"><Plus size={15} /> Book</Link>}
      />

      {all.length === 0 ? (
        <Panel>
          <Empty icon={CalendarDays} title="No visits yet." body="Book the first one and you will see it here from the moment an inspector is assigned to the moment the report lands."
            cta={<Link href="/app/book" className="btn btn-accent"><Plus size={16} /> Book a visit</Link>} />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {upcoming.length > 0 && (
            <Reveal>
              <Panel>
                <PanelHead title="Coming up" meta={`${upcoming.length} booked · next ${relative(upcoming[0].scheduledFor)}`} />
                <VisitRows rows={upcoming} props={props} inspectors={inspectors} openable={openable} />
              </Panel>
            </Reveal>
          )}
          {past.length > 0 && (
            <Reveal delay={0.05}>
              <Panel>
                <PanelHead title="Done" meta={`${past.length} ${past.length === 1 ? "visit" : "visits"} on record`} />
                <VisitRows rows={past} props={props} inspectors={inspectors} openable={openable} />
              </Panel>
            </Reveal>
          )}
        </div>
      )}
    </>
  );
}
