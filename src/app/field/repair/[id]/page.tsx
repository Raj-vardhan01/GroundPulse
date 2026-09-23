import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Navigation, Wrench } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, repairJob } from "@/lib/field";
import { RepairAfter } from "@/components/field/RepairAfter";
import { PhotoStrip } from "@/components/app/PhotoStrip";
import { VideoClip } from "@/components/app/VideoClip";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, fmtDateTime } from "@/lib/format";
import { navigateHref } from "@/lib/geo";

export default async function RepairPage({ params }: PageProps<"/field/repair/[id]">) {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const { id } = await params;
  const j = await repairJob(ins, id);
  if (!j) notFound();

  const { issue: i, property: p } = j;
  const r = i.repair!;
  const day = r.scheduledFor ? fmtDayDate(r.scheduledFor) : "a day the owner has not picked yet";
  const before = i.photos[0]?.thumb ?? null;

  return (
    <div className="grid gap-4">
      <Link href="/field" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2"><ArrowLeft size={14} /> Today</Link>

      <Reveal>
        <div className="card border border-line bg-white p-5 shadow-card">
          <p className="t-label flex items-center gap-1.5 font-mono"><Wrench size={12} /> Repair · {i.ref} · found on {j.visitRef}</p>
          <h1 className="serif mt-1 text-[clamp(1.5rem,5vw,2rem)] leading-[1.08] tracking-[-0.035em]">{i.title}</h1>
          <p className="t-small mt-1">{i.room} · {p.label}</p>
          <p className="t-small mt-1.5 flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0" /> {p.address}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[13px] text-text-2">
            <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {day}{r.slot ? ` · ${r.slot}` : ""}</span>
            <span className="flex items-center gap-1.5"><Wrench size={12} /> {r.providerName} ({r.trade})</span>
          </div>
          {!j.done && (
            <a href={navigateHref(p)} target="_blank" rel="noopener" className="btn btn-white btn-sm mt-3 w-full">
              <Navigation size={14} /> {p.pin ? "Navigate to the pin" : "Navigate to the address"}
            </a>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="card border border-line bg-white p-5 shadow-card">
          <h2 className="text-[15px] font-semibold">What you found</h2>
          {i.body && <p className="mt-1 text-[14.5px] leading-relaxed text-text-2">{i.body}</p>}
          <PhotoStrip photos={i.photos} label={`${i.room} · ${i.title}`} size={72} className="mt-3" />
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        {j.done ? (
          <div className="card border border-pass/30 bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Closed {r.completedAt ? fmtDateTime(r.completedAt) : ""}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {([["Before", before], ["After", r.afterPhoto?.thumb ?? null]] as const).map(([k, src]) => (
                <figure key={k} className="grid gap-1.5">
                  {src
                    ? <Image src={src} alt={k} width={320} height={240} unoptimized className="aspect-[4/3] w-full rounded-[12px] object-cover" />
                    : <span className="t-small grid aspect-[4/3] w-full place-items-center rounded-[12px] bg-paper">No photo</span>}
                  <figcaption className="t-label">{k}</figcaption>
                </figure>
              ))}
            </div>
            {r.afterVideo && <VideoClip v={r.afterVideo} label="After clip, same angle" className="mt-3" />}
            {r.note && <p className="mt-3 text-[14px] leading-relaxed text-text-2">{r.note}</p>}
          </div>
        ) : (
          <RepairAfter id={i.id} before={before} due={j.due} day={day} />
        )}
      </Reveal>
    </div>
  );
}
