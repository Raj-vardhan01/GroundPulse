import Link from "next/link";
import type { Route } from "next";
import { BadgeCheck, CheckCircle2, Flag, History } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { timeline, properties } from "@/lib/queries";
import { markAllRead } from "@/lib/actions";
import { Empty, PageHead, Panel, PanelHead } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, fmtTime, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Activity" };

export default async function Page() {
  const user = await requireOwner();
  const [events, props] = await Promise.all([timeline(user.id), properties(user.id)]);
  const label = (id: string | null) => props.find((p) => p.id === id)?.label ?? "";
  const unread = events.filter((e) => !e.readAt).length;

  /* Grouped by day, because "when did that happen" is the question this
     page is actually answering. */
  const groups = events.reduce<Record<string, typeof events>>((acc, e) => {
    const k = e.at.slice(0, 10);
    (acc[k] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <PageHead
        eyebrow="Nothing is hidden"
        title="Activity"
        lede="Every visit, every report, every decision — in the order it happened, with the time it happened."
        action={unread > 0 ? <form action={markAllRead}><button className="btn btn-pill btn-sm">Mark all read</button></form> : undefined}
      />

      {events.length === 0 ? (
        <Panel><Empty icon={History} title="Nothing yet." body="As soon as a property is added or a visit is booked, it shows up here — and stays." /></Panel>
      ) : (
        <div className="grid gap-4">
          {Object.entries(groups).map(([day, rows], gi) => (
            <Reveal key={day} delay={0.03 * gi}>
              <Panel>
                <PanelHead title={fmtDate(day, { year: true })} meta={relative(day)} />
                <ol className="relative px-5 py-4">
                  <span className="absolute bottom-6 left-[29px] top-7 w-px bg-line" />
                  {rows.map((e) => (
                    <li key={e.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                      <span className={cn("relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4 ring-white",
                        e.type.startsWith("issue") ? "bg-warn-soft text-warn" : e.type.startsWith("report") ? "bg-pass-soft text-pass" : "bg-accent-tint text-accent")}>
                        {e.type.startsWith("report") ? <CheckCircle2 size={11} /> : e.type.startsWith("issue") ? <Flag size={10} /> : <BadgeCheck size={11} />}
                      </span>
                      <Link href={e.href as Route} className="min-w-0 flex-1 rounded-[10px] py-0.5 transition hover:opacity-70">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14.5px] font-medium">{e.title}</span>
                          {!e.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                        </div>
                        <div className="t-small mt-0.5 leading-snug">{e.body}</div>
                        <div className="mt-1 text-[11.5px] text-text-3">{fmtTime(e.at)}{label(e.propertyId) ? ` · ${label(e.propertyId)}` : ""}</div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </Panel>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
