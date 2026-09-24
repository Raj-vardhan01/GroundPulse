import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bike, CalendarDays, ClipboardList, Hand, KeyRound, Lock, MapPin, MessageSquareQuote, Video,
} from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, jobView, claimCheck, CAN_WORK, STATUS_COPY } from "@/lib/field";
import { freeReleaseUntil, freeToHandBack, PENALTY } from "@/lib/jobs";
import { fmtDateTime } from "@/lib/format";
import { claimJob } from "@/lib/fieldActions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { JobTags } from "@/components/field/JobCard";
import { Panel, PanelHead, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { blocksFor } from "@/lib/checklist";
import { fmtDayDate, relative } from "@/lib/format";
import { fmtKm } from "@/lib/geo";
import { hoursWords, includedMinutes, OVERTIME, payLines } from "@/lib/payout";

export default async function JobBrief({ params }: PageProps<"/field/jobs/[id]">) {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const { id } = await params;
  const j = await jobView(ins, id);
  if (!j) notFound();

  const mine = j.visit.inspectorId === ins.id;
  const refusal = mine ? null : await claimCheck(ins, j.visit.id);
  const freeUntil = freeReleaseUntil(j.visit);
  const canWork = CAN_WORK.includes(ins.status);
  const blocks = blocksFor(j.property);
  /* A job booked before the rates changed pays what it was booked at —
     the lines are shown only when they add up to it. */
  const lines = payLines(j.property, j.visit.kind, j.visit.addOns);
  const current = lines.reduce((n, l) => n + l.v, 0) === j.visit.payoutInr;

  return (
    <div className="grid gap-4">
      <Link href="/field/jobs" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2"><ArrowLeft size={14} /> Board</Link>

      <Reveal>
        <Panel className="p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="grow basis-[13rem]">
              <p className="t-label font-mono">{j.visit.ref}</p>
              <h1 className="serif mt-1 text-[clamp(1.6rem,5.5vw,2.1rem)] leading-[1.08] tracking-[-0.035em]">
                {j.property.locality || j.property.city}
              </h1>
              <p className="t-small mt-1.5 flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> {j.property.address}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[24px] font-semibold tabular-nums">{money(j.visit.payoutInr)}</div>
              <div className="t-small">you earn</div>
            </div>
          </div>
          <div className="mt-3"><JobTags j={j} /></div>
          <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13.5px] sm:grid-cols-2">
            <span className="flex items-center gap-2"><CalendarDays size={13} className="text-text-3" /> {fmtDayDate(j.visit.scheduledFor)} · {relative(j.visit.scheduledFor)}</span>
            <span className="flex items-center gap-2"><ClipboardList size={13} className="text-text-3" /> {j.visit.slot}</span>
            <span className="flex items-center gap-2"><Bike size={13} className="text-text-3" /> {fmtKm(j.km)} from {ins.baseLocality || `central ${ins.city}`} · about {j.minutes} min</span>
            <span className="flex items-center gap-2"><MapPin size={13} className="text-text-3" /> {j.property.type || "Plot"} · {j.rooms} areas</span>
          </div>
        </Panel>
      </Reveal>

      {/* what the money is made of — nobody should accept work blind */}
      <Reveal delay={0.04}>
        <Panel>
          <PanelHead title="What this pays" meta="Per visit, paid the same day" />
          <ul className="grid gap-2 p-5 text-[13.5px]">
            {current
              ? lines.map((l) => <Row key={l.k} k={l.k} v={l.v} />)
              : <Row k="At the rates when it was booked" v={j.visit.payoutInr} />}
            <li className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
              <span>Total</span><span className="tabular-nums">{money(j.visit.payoutInr)}</span>
            </li>
          </ul>
          <p className="t-small border-t border-line px-5 py-3 leading-snug">
            Plus {money(OVERTIME.perHour)} for every hour on site past the first {hoursWords(includedMinutes(j.property, j.visit.kind))} — counted from check-in to submit, paid by us, never added to the owner&apos;s bill.
          </p>
        </Panel>
      </Reveal>

      {/* everything you need before you leave home */}
      <Reveal delay={0.06}>
        <Panel>
          <PanelHead title="Before you go" meta={`${j.ownerName} is the owner`} />
          <div className="grid gap-4 p-5">
            <div>
              <div className="t-label flex items-center gap-1.5"><KeyRound size={12} /> Getting in</div>
              <p className="mt-1 text-[14.5px] leading-relaxed">{j.property.accessNote || <span className="text-text-3">Nothing noted — ring the owner if you are stuck.</span>}</p>
            </div>
            {j.property.keyHolderName && (
              <div>
                <div className="t-label">Key holder</div>
                <p className="mt-1 text-[14.5px]">{j.property.keyHolderName} · <span className="tabular-nums">{j.property.keyHolderPhone}</span></p>
              </div>
            )}
            {j.visit.notes && (
              <div className="rounded-[12px] bg-paper p-4">
                <div className="t-label flex items-center gap-1.5"><MessageSquareQuote size={12} /> The owner asked</div>
                <p className="mt-1 text-[14.5px] leading-relaxed">{j.visit.notes}</p>
              </div>
            )}
            {j.visit.liveCall && (
              <p className="flex items-start gap-2 rounded-[12px] bg-accent-tint px-4 py-3 text-[13.5px] leading-snug text-accent-2">
                <Video size={14} className="mt-0.5 shrink-0" /> They have asked for a live call during the visit. Ring them from inside when you start.
              </p>
            )}
            <p className="t-small leading-snug">
              You will need a code from the owner at the door. The checklist does not open without it — that is the rule you signed, and the app holds you to it.
            </p>
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.08}>
        <Panel>
          <PanelHead title="What you will walk" meta={`${blocks.length} areas · ${j.items} items`} />
          <ul className="grid gap-px bg-line sm:grid-cols-2">
            {blocks.map((b) => (
              <li key={b.name} className="bg-white px-5 py-3">
                <div className="text-[14px] font-medium">{b.name}</div>
                <div className="t-small mt-0.5 leading-snug">{b.items.join(" · ")}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </Reveal>

      {/* claim */}
      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20">
        <div className="card border border-line bg-white p-4 shadow-float">
          {j.visit.inspectorId === ins.id ? (
            <Link href={`/field/visit/${j.visit.id}` as Route} className="btn btn-accent w-full">Open this job</Link>
          ) : !canWork ? (
            <p className="flex items-start gap-2 text-[13.5px] leading-snug text-text-2"><Lock size={15} className="mt-0.5 shrink-0" /> {STATUS_COPY[ins.status].note}</p>
          ) : refusal ? (
            <>
              <p className="flex items-start gap-2 text-[13.5px] leading-snug text-text-2">
                <Lock size={15} className="mt-0.5 shrink-0" /> {refusal}
              </p>
              <Link href="/field" className="btn btn-white btn-sm mt-3 w-full">See your jobs</Link>
            </>
          ) : (
            <form action={claimJob}>
              <input type="hidden" name="id" value={j.visit.id} />
              <SubmitButton className="w-full" pendingLabel="Claiming…"><Hand size={16} /> Claim this job</SubmitButton>
              <p className="t-small mt-2 text-center leading-snug">
                {freeToHandBack(j.visit)
                  ? <>Hand it back free until {fmtDateTime(new Date(freeUntil).toISOString())}; after that ₹{PENALTY.lateRelease} comes off your deposit.</>
                  : <>This one is under {PENALTY.freeReleaseHours} hours away — handing it back costs ₹{PENALTY.lateRelease}.</>}
                {" "}Not turning up costs ₹{PENALTY.noShow} — once you have told the owner you are on the way, you get {PENALTY.enRouteGraceMinutes} minutes past the window to check in.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: number }) => (
  <li className="flex justify-between gap-3">
    <span className="text-text-2">{k}</span>
    <span className="shrink-0 tabular-nums">{money(v)}</span>
  </li>
);
