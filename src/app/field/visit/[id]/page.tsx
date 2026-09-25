import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, BadgeCheck, CheckCircle2, ClipboardList, Clock, KeyRound, MapPin,
  MessageSquareQuote, Navigation, Phone, Radio, Undo2, Video,
} from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, jobView, liveIssues } from "@/lib/field";
import { LiveDecisions } from "@/components/field/LiveDecisions";
import { releaseJob } from "@/lib/fieldActions";
import { CheckInGate } from "@/components/field/CheckInGate";
import { VisitWork } from "@/components/field/VisitWork";
import { JobTags } from "@/components/field/JobCard";
import { Panel, PanelHead, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, fmtTime } from "@/lib/format";
import { afterOpen, afterOpensAt, cleanOf } from "@/lib/checklist";
import { checkInWords, navigateHref } from "@/lib/geo";
import { telHref } from "@/lib/phone";
import { cn } from "@/lib/cn";

export default async function LiveVisit({ params, searchParams }: PageProps<"/field/visit/[id]">) {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const { id } = await params;
  const sp = await searchParams;
  const j = await jobView(ins, id);
  if (!j || j.visit.inspectorId !== ins.id) notFound();

  const v = j.visit;
  const onSite = v.status === "on_site";
  const live = onSite ? await liveIssues(v.id) : [];
  const finished = ["submitted", "ready", "closed"].includes(v.status);
  /* a clean on this visit: the before/after photos and the crew's clock */
  const size = j.property.size;
  const tier = onSite ? cleanOf(v) : null;
  const opensAt = afterOpensAt(v, size);
  const clean = tier ? {
    name: tier.name, hours: tier.hours[size], crew: tier.crew[size],
    started: v.crewStartedAt ? fmtTime(v.crewStartedAt) : null,
    opensAt: opensAt ? fmtTime(new Date(opensAt).toISOString()) : null,
    open: afterOpen(v, size),
  } : null;

  return (
    <div className="grid gap-4">
      <Link href="/field" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2"><ArrowLeft size={14} /> Today</Link>

      {/* the job, always at the top while they work */}
      <Reveal>
        <div className={cn("card p-5 shadow-card", onSite ? "on-dark bg-ink" : "border border-line bg-white")}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="grow basis-[13rem]">
              <p className={cn("t-label font-mono", onSite && "text-white/55")}>{v.ref}</p>
              <h1 className={cn("serif mt-1 text-[clamp(1.5rem,5vw,2rem)] leading-[1.08] tracking-[-0.035em]", onSite && "text-white")}>
                {j.property.label}
              </h1>
              <p className={cn("t-small mt-1.5 flex items-start gap-1.5", onSite && "text-white/65")}>
                <MapPin size={13} className="mt-0.5 shrink-0" /> {j.property.address}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className={cn("text-[20px] font-semibold tabular-nums", onSite && "text-white")}>{money(v.payoutInr)}</div>
              <div className={cn("t-small", onSite && "text-white/55")}>you earn</div>
            </div>
          </div>

          <div className="mt-3"><JobTags j={j} /></div>

          <div className={cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3.5 text-[13px]", onSite ? "border-white/12 text-white/70" : "border-line text-text-2")}>
            <span className="flex items-center gap-1.5"><Clock size={12} /> {fmtDayDate(v.scheduledFor)} · {v.slot}</span>
            {v.startedAt && <span className="flex items-center gap-1.5"><KeyRound size={12} /> in at {fmtTime(v.startedAt)}</span>}
            {v.checkIn && <span className="flex items-center gap-1.5"><MapPin size={12} /> {checkInWords(v.checkIn).short}</span>}
            {v.recording && <span className="flex items-center gap-1.5"><Radio size={12} /> body cam</span>}
          </div>

          {!onSite && !finished && (
            <a href={navigateHref(j.property)} target="_blank" rel="noopener" className="btn btn-white btn-sm mt-3 w-full">
              <Navigation size={14} /> {j.property.pin ? "Navigate to the pin" : "Navigate to the address"}
            </a>
          )}

          {onSite && v.checkIn?.doorPhoto && (
            <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-white/[0.07] p-2.5">
              <Image src={v.checkIn.doorPhoto.thumb} alt="Front door" width={48} height={48} unoptimized className="h-12 w-12 rounded-[8px] object-cover" />
              <span className="text-[12.5px] text-white/65">Front door, {fmtTime(v.checkIn.at)} · stamped and sent</span>
            </div>
          )}
        </div>
      </Reveal>

      {/* owner instructions travel with the job */}
      {(v.notes || v.liveCall) && !finished && (
        <Reveal delay={0.04}>
          <div className="card border border-line bg-white p-4 shadow-card">
            {v.notes && (
              <>
                <div className="t-label flex items-center gap-1.5"><MessageSquareQuote size={12} /> {j.ownerName} asked</div>
                <p className="mt-1 text-[14.5px] leading-relaxed">{v.notes}</p>
              </>
            )}
            {v.liveCall && (j.ownerPhone ? (
              <a href={telHref(j.ownerPhone)} className="btn btn-white btn-sm mt-3 w-full">
                <Phone size={14} /> Ring the owner — they asked for a live call
              </a>
            ) : (
              <p className="t-small mt-3">They asked for a live call, but there is no number on their account — call ops and we will put you through.</p>
            ))}
          </div>
        </Reveal>
      )}

      {/* the work */}
      {sp.done === "1" || finished ? (
        <Reveal delay={0.05}>
          <Panel className="p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pass-soft text-pass"><CheckCircle2 size={24} /></span>
            <h2 className="serif mt-4 text-[24px] tracking-[-0.03em]">Submitted.</h2>
            <p className="t-small mx-auto mt-2 max-w-[40ch]">
              {v.status === "submitted"
                ? "A reviewer reads it before the owner does — that is how probation works. You will hear if anything needs another look."
                : "The owner has it. Anything you flagged is now a question waiting on them."}
            </p>
            <div className="mt-5 grid gap-2">
              <Link href="/field/jobs" className="btn btn-accent"><ClipboardList size={16} /> Take the next job</Link>
              <Link href="/field/earnings" className="btn btn-white">See earnings</Link>
            </div>
          </Panel>
        </Reveal>
      ) : onSite && v.draft ? (
        <>
          <LiveDecisions issues={live} />
          <VisitWork id={v.id} draft={v.draft} clean={clean} />
        </>
      ) : (
        <>
          <Reveal delay={0.05}><CheckInGate id={v.id} status={v.status} recording={v.recording} pin={j.property.pin} /></Reveal>

          <Reveal delay={0.08}>
            <Panel>
              <PanelHead title="Getting in" meta={j.property.keyHolderName || "No key holder listed"} />
              <div className="grid gap-3 p-5">
                <p className="text-[14.5px] leading-relaxed">{j.property.accessNote || <span className="text-text-3">Nothing noted.</span>}</p>
                {j.property.keyHolderPhone && (
                  <a href={`tel:${j.property.keyHolderPhone.replace(/\s/g, "")}`} className="btn btn-white btn-sm w-full">
                    <Phone size={14} /> Call {j.property.keyHolderName || "the key holder"}
                  </a>
                )}
              </div>
            </Panel>
          </Reveal>

          {v.status === "assigned" && (
            <Reveal delay={0.1}>
              <form action={releaseJob} className="card border border-line bg-white p-4 shadow-card">
                <input type="hidden" name="id" value={v.id} />
                <p className="t-small leading-snug">
                  Cannot make it? Hand it back now, before you go in — somebody else can still take it today. Once you are inside it is yours.
                </p>
                <button className="btn btn-white btn-sm mt-3 w-full"><Undo2 size={14} /> Give this job back</button>
              </form>
            </Reveal>
          )}
        </>
      )}

      {onSite && (
        <p className="t-small flex items-start gap-2 px-1 pb-2">
          <BadgeCheck size={14} className="mt-0.5 shrink-0 text-accent" />
          Wardrobes, lockers and drawers stay shut. Photograph them closed and flag what you can see from outside.
          {v.recording && <> The camera stays on until you are out of the gate.</>}
          {v.liveCall && <> <Video size={13} className="inline" /> They asked for a call — ring them before you finish.</>}
        </p>
      )}
    </div>
  );
}
