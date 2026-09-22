import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, CreditCard, Flag,
  Home as HomeIcon, MapPin, Plus, Radio,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { propertyViews, portfolioScore, openIssues, timeline, invoices, inspectorsById } from "@/lib/queries";
import { PropertyCard } from "@/components/app/PropertyCard";
import { Empty, Panel, PanelHead, Stat, StatusPill, money } from "@/components/app/ui";
import { HealthRing } from "@/components/ui/HealthRing";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

const hello = () => {
  const h = new Date().getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default async function Dashboard() {
  const user = await requireOwner();
  const [views, issues, events, invs, inspectors] = await Promise.all([
    propertyViews(user.id), openIssues(user.id), timeline(user.id), invoices(user.id), inspectorsById(),
  ]);

  const score = portfolioScore(views);
  const live = views.map((v) => v.liveVisit).find(Boolean);
  const liveProperty = views.find((v) => v.liveVisit)?.property;
  const due = invs.filter((i) => i.status === "due");
  const upcoming = views.map((v) => v.nextVisit).filter(Boolean).sort((a, b) => (a!.scheduledFor < b!.scheduledFor ? -1 : 1));
  const first = user.name.split(" ")[0];

  if (!views.length) {
    return (
      <Panel>
        <Empty
          icon={HomeIcon}
          title="Nothing here yet."
          body="Add the first property and we will show you its condition, its visits and every decision waiting on you — all on this page."
          cta={<Link href="/app/properties/new" className="btn btn-accent"><Plus size={16} /> Add a property</Link>}
        />
      </Panel>
    );
  }

  return (
    <div className="grid gap-5">
      {/* ── who you are, and how it all stands ─────────────── */}
      <Reveal>
        <section className="card overflow-hidden border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-6 p-6 sm:p-7">
            <div className="grow basis-[15rem]">
              <p className="t-label">{hello()}{first ? `, ${first}` : ""}</p>
              <h1 className="serif mt-1.5 text-[clamp(1.8rem,3.2vw,2.5rem)] leading-[1.06] tracking-[-0.035em]">
                {issues.length
                  ? <>{issues.length} {issues.length === 1 ? "thing needs" : "things need"} your decision.</>
                  : live ? <>Someone is at your {liveProperty?.kind === "plot" ? "plot" : "place"} right now.</>
                  : upcoming.length ? <>All clear. Next visit {relative(upcoming[0]!.scheduledFor)}.</>
                  : <>All clear across {views.length} {views.length === 1 ? "property" : "properties"}.</>}
              </h1>
              <p className="t-small mt-2 max-w-[54ch]">
                {issues.length
                  ? "Nothing gets repaired until you say so. Open the report, look at the photographs, then decide."
                  : "Everything we have checked is where it should be. You will hear from us the moment that changes."}
              </p>
            </div>
            {score !== null && <HealthRing score={score} size={104} stroke={8} label="Portfolio" delay={0.25} />}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-4 sm:grid-cols-4 sm:p-5">
            <Stat n={views.length} l={views.length === 1 ? "Property" : "Properties"} />
            <Stat n={upcoming.length} l="Visits booked" tone={upcoming.length ? "accent" : undefined} />
            <Stat n={issues.length} l="Waiting on you" tone={issues.length ? "fail" : undefined} />
            <Stat n={due.length ? money(due.reduce((n, i) => n + i.amountInr, 0)) : "—"} l="Payable" tone={due.length ? "warn" : undefined} />
          </div>
        </section>
      </Reveal>

      {/* ── happening right now ─────────────────────────────── */}
      {live && liveProperty && (
        <Reveal delay={0.05}>
          <section className="on-dark card overflow-hidden bg-ink shadow-float">
            <div className="flex flex-wrap items-center gap-4 p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white"><Radio size={20} /></span>
              <div className="grow basis-[15rem]">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  <span className="ping relative h-[6px] w-[6px] rounded-full bg-pass text-pass" /> Live
                </div>
                <h2 className="mt-1 text-[20px] font-medium tracking-[-0.025em] text-white">
                  {inspectors[live.inspectorId]?.name ?? "Your inspector"} is {live.status === "on_site" ? "on site" : live.status === "en_route" ? "on the way" : "writing the report"}
                </h2>
                <p className="mt-1 text-[13.5px] text-white/60">{liveProperty.label} · started {relative(live.startedAt ?? live.createdAt)} · {live.slot}</p>
              </div>
              <Link href={`/app/visits/${live.id}` as Route} className="btn btn-line text-white">Follow along <ArrowRight size={15} /></Link>
            </div>
          </section>
        </Reveal>
      )}

      {/* ── waiting on you ──────────────────────────────────── */}
      {(issues.length > 0 || due.length > 0) && (
        <Reveal delay={0.08}>
          <Panel>
            <PanelHead title="Waiting on you" meta="Nothing moves until you decide" />
            <ul className="divide-y divide-line">
              {issues.map((i) => (
                <li key={i.id}>
                  <Link href={`/app/reports/${i.reportId}#${i.id}` as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", i.severity === "fail" ? "bg-fail-soft text-fail" : "bg-warn-soft text-warn")}><Flag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{i.title}</div>
                      <div className="t-small mt-0.5 truncate">{views.find((v) => v.property.id === i.propertyId)?.property.label} · {i.room} · {i.ref}</div>
                    </div>
                    {i.quote && <span className="hidden shrink-0 text-right sm:block"><span className="block text-[15px] font-medium tabular-nums">{money(i.quote.total)}</span><span className="t-small">quoted</span></span>}
                    <span className="btn btn-pill btn-sm shrink-0 group-hover:bg-accent group-hover:text-white group-hover:shadow-none">Decide</span>
                  </Link>
                </li>
              ))}
              {due.map((i) => (
                <li key={i.id}>
                  <Link href="/app/billing" className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><CreditCard size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{i.title}</div>
                      <div className="t-small mt-0.5">{i.ref} · raised {relative(i.createdAt)}</div>
                    </div>
                    <span className="shrink-0 text-[15px] font-medium tabular-nums">{money(i.amountInr)}</span>
                    <ArrowUpRight size={16} className="shrink-0 text-text-3 transition group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      )}

      {/* ── properties ──────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <div className="flex items-end justify-between pb-1 pt-2">
          <h2 className="serif text-[24px] tracking-[-0.03em]">Your properties</h2>
          <Link href="/app/properties/new" className="btn btn-pill btn-sm"><Plus size={15} /> Add</Link>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2">
        {views.map((v, i) => <Reveal key={v.property.id} delay={0.04 * i}><PropertyCard v={v} /></Reveal>)}
      </div>

      {/* ── what is booked, and what just happened ──────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Panel className="h-full">
            <PanelHead title="Coming up" meta={upcoming.length ? `${upcoming.length} booked` : "Nothing booked"} action={<Link href="/app/book" className="btn btn-pill btn-sm">Book</Link>} />
            {upcoming.length === 0 ? (
              <p className="t-small px-5 py-8 text-center">A quarterly rhythm is what keeps a shut house from going quietly wrong. Book the next one whenever you are ready.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((v) => {
                  const prop = views.find((x) => x.property.id === v!.propertyId)!.property;
                  const ins = inspectors[v!.inspectorId];
                  return (
                    <li key={v!.id}>
                      <Link href={`/app/visits/${v!.id}` as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-tint text-accent">
                          <CalendarDays size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-medium">{prop.label}</div>
                          <div className="t-small mt-0.5 truncate">{fmtDayDate(v!.scheduledFor)} · {v!.slot}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusPill status={v!.status} />
                          {ins && <div className="t-small mt-1 flex items-center justify-end gap-1"><BadgeCheck size={11} className="text-accent" /> {ins.name}</div>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.05}>
          <Panel className="h-full">
            <PanelHead title="Recent activity" meta="Everything, in order" action={<Link href="/app/activity" className="btn btn-pill btn-sm">All</Link>} />
            <ul className="divide-y divide-line">
              {events.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <Link href={e.href as Route} className="flex gap-3 px-5 py-3.5 transition hover:bg-paper">
                    <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", e.readAt ? "bg-line-2" : "bg-accent")} />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{e.title}</div>
                      <div className="t-small truncate">{e.body}</div>
                    </div>
                    <span className="t-small ml-auto shrink-0 whitespace-nowrap">{relative(e.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      {/* ── the quiet promise, restated where it matters ────── */}
      <Reveal>
        <section className="card border border-accent/15 bg-accent-tint p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-accent shadow-card"><MapPin size={17} /></span>
            <p className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-accent-2">
              Every photograph in your reports is GPS- and time-stamped, stored privately, and never shown to anyone but you. No repair is ever started without your approval.
            </p>
            <Link href="/app/help" className="btn btn-pill btn-sm shrink-0 border-accent/20">How it works</Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
