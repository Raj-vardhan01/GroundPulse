import { AlertTriangle, BadgeCheck, CalendarClock, Check, MapPinned, Star } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, doneJobs, STATUS_COPY } from "@/lib/field";
import { SignOutRow } from "@/components/field/FieldShell";
import { Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Me" };

/* Documents expire — a police-verification certificate is renewed every
   year — so the list shows dates, not ticks alone. An inspector should
   find out theirs is running out here, not at somebody's gate. */
const EXPIRING_DAYS = 60;
const daysLeft = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);

export default async function Record() {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const done = await doneJobs(ins);
  const copy = STATUS_COPY[ins.status];

  return (
    <div className="grid gap-4">
      <Reveal>
        <Panel className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-[20px] font-semibold text-white">{ins.initials}</span>
            <div className="grow basis-[10rem]">
              <div className="flex items-center gap-1.5 text-[20px] font-semibold tracking-[-0.02em]">
                {ins.name} {ins.verified && <BadgeCheck size={17} className="text-accent" />}
              </div>
              <div className="t-small mt-0.5">{ins.bg}</div>
              <div className="t-small mt-0.5 flex items-center gap-1.5"><MapPinned size={11} /> {ins.baseLocality} · {ins.city}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            <Stat n={<span className="flex items-center gap-1"><Star size={16} className="fill-gold text-gold" />{ins.rating}</span>} l="Owner rating" />
            <Stat n={ins.visits + done.length} l="Visits walked" />
            <Stat n={`'${ins.since.slice(2)}`} l="With us since" />
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.04}>
        <div className={cn("card border p-4",
          copy.tone === "pass" ? "border-pass/30 bg-pass-soft" : copy.tone === "fail" ? "border-fail/30 bg-fail-soft" : "border-warn/30 bg-warn-soft")}>
          <div className="text-[14.5px] font-semibold">{copy.label}</div>
          <p className="mt-1 text-[13.5px] leading-snug text-text-2">{copy.note}</p>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <Panel>
          <PanelHead title="Your documents" meta="What we hold, and when it runs out" />
          <ul className="divide-y divide-line">
            {ins.docs.map((doc) => {
              const days = doc.expiresAt ? daysLeft(doc.expiresAt) : null;
              const soon = days !== null && days <= EXPIRING_DAYS;
              return (
                <li key={doc.name} className="flex items-center gap-3 px-5 py-3.5">
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    soon ? "bg-warn-soft text-warn" : doc.ok ? "bg-pass-soft text-pass" : "bg-beige text-text-2")}>
                    {soon ? <AlertTriangle size={14} /> : <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="grow basis-[10rem] text-[14px] font-medium">{doc.name}</span>
                  <span className={cn("t-small shrink-0 text-right", soon && "font-medium text-warn")}>
                    {doc.expiresAt ? (soon ? `renew in ${days} days` : `valid to ${fmtDate(doc.expiresAt, { year: true })}`) : "on file"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="t-small border-t border-line px-5 py-3.5 leading-snug">
            Originals were checked in person. Nothing here was verified from a photograph.
          </p>
        </Panel>
      </Reveal>

      <Reveal delay={0.08}>
        <Panel>
          <PanelHead title="Where you work" meta={`${ins.areas.length} localities`} />
          <div className="p-5">
            <div className="flex flex-wrap gap-1.5">
              {ins.areas.map((a) => <span key={a} className={cn("chip", a === ins.baseLocality && "chip-accent")}>{a}</span>)}
            </div>
            <div className="t-label mt-4 flex items-center gap-1.5"><CalendarClock size={12} /> When you are free</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ins.availability.map((a) => <span key={a} className="chip">{a}</span>)}
            </div>
            <p className="t-small mt-4 leading-snug">
              The board shows every open job in {ins.city}, sorted from {ins.baseLocality}. To change any of this, call us — it is not something to edit alone.
            </p>
          </div>
        </Panel>
      </Reveal>

      {done.length > 0 && (
        <Reveal delay={0.1}>
          <Panel>
            <PanelHead title="Everything you have walked" meta={`${done.length} visits`} />
            <ul className="divide-y divide-line">
              {done.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grow basis-[10rem] text-[14px] font-medium">{v.ref}</span>
                  <span className="t-small shrink-0">{relative(v.scheduledFor)}</span>
                  <span className="shrink-0 text-[14px] font-medium tabular-nums">{money(v.payoutInr)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      )}

      <SignOutRow name={ins.name} phone={ins.phone} />
    </div>
  );
}
