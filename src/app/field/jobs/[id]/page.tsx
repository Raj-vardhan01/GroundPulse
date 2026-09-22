import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bike, CalendarDays, ClipboardList, Hand, KeyRound, Lock, MapPin, MessageSquareQuote, Video,
} from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, jobView, liveJob, CAN_WORK, STATUS_COPY } from "@/lib/field";
import { claimJob } from "@/lib/fieldActions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { JobTags } from "@/components/field/JobCard";
import { Panel, PanelHead, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { blocksFor } from "@/lib/checklist";
import { fmtDayDate, relative } from "@/lib/format";
import { fmtKm } from "@/lib/geo";
import { RATES } from "@/lib/payout";

export default async function JobBrief({ params }: PageProps<"/field/jobs/[id]">) {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const { id } = await params;
  const j = await jobView(ins, id);
  if (!j) notFound();

  const live = await liveJob(ins);
  const blocked = live && live.visit.id !== j.visit.id;
  const canWork = CAN_WORK.includes(ins.status);
  const blocks = blocksFor(j.property);
  const a = j.visit.addOns;

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
            <span className="flex items-center gap-2"><Bike size={13} className="text-text-3" /> {fmtKm(j.km)} from {ins.baseLocality} · about {j.minutes} min</span>
            <span className="flex items-center gap-2"><MapPin size={13} className="text-text-3" /> {j.property.type || "Plot"} · {j.rooms} areas</span>
          </div>
        </Panel>
      </Reveal>

      {/* what the money is made of — nobody should accept work blind */}
      <Reveal delay={0.04}>
        <Panel>
          <PanelHead title="What this pays" meta="Per visit, settled weekly" />
          <ul className="grid gap-2 p-5 text-[13.5px]">
            {j.visit.kind === "plot"
              ? <Row k="Boundary walk" v={RATES.plot} />
              : <>
                  <Row k="Turning up, entry checks, exit walkthrough" v={RATES.base} />
                  <Row k={`${blocks.length} room blocks × ${money(RATES.perRoom)}`} v={blocks.length * RATES.perRoom} />
                </>}
            {(j.visit.kind === "cleaning" || a.cleaning || a.deep) && <Row k="Staying with the cleaning crew" v={RATES.cleaningSupervision} />}
            {!!a.car && <Row k={`Car check × ${a.car}`} v={RATES.perCar * a.car} />}
            {!!a.camera && <Row k="Body camera, worn and handed over" v={RATES.camera} />}
            <li className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
              <span>Total</span><span className="tabular-nums">{money(j.visit.payoutInr)}</span>
            </li>
          </ul>
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
          ) : blocked ? (
            <>
              <p className="flex items-start gap-2 text-[13.5px] leading-snug text-text-2">
                <Lock size={15} className="mt-0.5 shrink-0" /> You still have <b className="mx-1">{live!.property.label}</b> open. One job at a time.
              </p>
              <Link href={`/field/visit/${live!.visit.id}` as Route} className="btn btn-white btn-sm mt-3 w-full">Finish that one first</Link>
            </>
          ) : (
            <form action={claimJob}>
              <input type="hidden" name="id" value={j.visit.id} />
              <SubmitButton className="w-full" pendingLabel="Claiming…"><Hand size={16} /> Claim this job</SubmitButton>
              <p className="t-small mt-2 text-center leading-snug">You can hand it back any time before you go in.</p>
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
