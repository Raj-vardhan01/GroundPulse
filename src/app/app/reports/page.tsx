import Link from "next/link";
import type { Route } from "next";
import { FileText, Flag, Plus } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { propertyViews } from "@/lib/queries";
import { HealthRing } from "@/components/ui/HealthRing";
import { Empty, PageHead, Panel, PanelHead } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Reports" };

export default async function Page() {
  const user = await requireOwner();
  const views = await propertyViews(user.id);
  const rows = views.flatMap((v) => v.reports.map((r) => ({ r, p: v.property, issues: v.openIssues.filter((i) => i.reportId === r.id) })))
    .sort((a, b) => (a.r.publishedAt < b.r.publishedAt ? 1 : -1));

  return (
    <>
      <PageHead
        eyebrow="Everything, on the record"
        title="Reports"
        lede="Every visit produces one. They never expire, and nobody can edit one after it is delivered."
      />
      {rows.length === 0 ? (
        <Panel>
          <Empty icon={FileText} title="No reports yet." body="The first inspection sets the baseline — health score, room by room, with photographs on every item."
            cta={<Link href="/app/book" className="btn btn-accent"><Plus size={16} /> Book a visit</Link>} />
        </Panel>
      ) : (
        <Reveal>
          <Panel>
            <PanelHead title="All reports" meta={`${rows.length} delivered`} />
            <ul className="divide-y divide-line">
              {rows.map(({ r, p, issues }) => (
                <li key={r.id}>
                  <Link href={`/app/reports/${r.id}` as Route} className="flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <HealthRing score={r.score} size={48} stroke={4.5} delay={0.1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-medium">{p.label}</span>
                        {!r.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      </div>
                      <div className="t-small mt-0.5 truncate font-mono">{r.ref} · {fmtDate(r.publishedAt, { year: true })} · {relative(r.publishedAt)}</div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      <span className="chip chip-pass">{r.counts.pass}</span>
                      {r.counts.attn > 0 && <span className="chip chip-warn">{r.counts.attn}</span>}
                      {r.counts.fail > 0 && <span className="chip chip-fail">{r.counts.fail}</span>}
                    </div>
                    {issues.length > 0 && (
                      <span className={cn("chip shrink-0", issues.some((i) => i.severity === "fail") ? "chip-fail" : "chip-warn")}>
                        <Flag size={10} className="mr-0.5" /> {issues.length} waiting
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      )}
    </>
  );
}
