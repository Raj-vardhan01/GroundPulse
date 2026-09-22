import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, Check, Clock, Flag, KeyRound, MapPin, Play, Video,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { reportView } from "@/lib/queries";
import { HealthRing } from "@/components/ui/HealthRing";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Panel, PanelHead, Stat } from "@/components/app/ui";
import { IssueCard } from "@/components/app/IssueCard";
import { MarkRead } from "@/components/app/MarkRead";
import { HEALTH } from "@/lib/checklist";
import { fmtDate, fmtDateTime, fmtDayDate } from "@/lib/format";
import { bhkLabel } from "@/lib/cleaning";
import { cn } from "@/lib/cn";
import type { ItemState } from "@/lib/types";

const chipOf = (s: ItemState) => (s === "pass" ? "chip chip-pass" : s === "fail" ? "chip chip-fail" : "chip chip-warn");
const labelOf = (s: ItemState) => (s === "pass" ? "Pass" : s === "fail" ? "Fail" : "Attention");

export default async function Page({ params }: PageProps<"/app/reports/[id]">) {
  const user = await requireOwner();
  const { id } = await params;
  const view = await reportView(user.id, id);
  if (!view) notFound();

  const { report: r, property: p, visit: v, inspector, issues } = view;
  const open = issues.filter((i) => i.decision === "pending");
  const settled = issues.filter((i) => i.decision !== "pending");
  const total = r.counts.pass + r.counts.attn + r.counts.fail;

  return (
    <>
      <MarkRead id={r.id} already={!!r.readAt} />
      <Link href={`/app/properties/${p.id}` as Route} className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> {p.label}</Link>

      {/* ── the headline ───────────────────────────────────── */}
      <Reveal>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel className="p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grow basis-[15rem]">
                <div className="t-small font-mono">{r.ref}</div>
                <h1 className="serif mt-1 text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">{p.label}</h1>
                <div className="t-small mt-1.5 flex items-center gap-1.5"><MapPin size={13} /> {p.address} · {p.kind === "plot" ? "Plot" : bhkLabel[p.size]}</div>
              </div>
              <HealthRing score={r.score} size={96} stroke={8} label="Health" delay={0.25} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat n={r.counts.pass} l="Pass" tone="pass" />
              <Stat n={r.counts.attn} l="Attention" tone="warn" />
              <Stat n={r.counts.fail} l="Fail" tone="fail" />
            </div>
            <p className="t-small mt-2.5">
              {total} items checked. The score starts at 100 — an attention costs {HEALTH.attn}, a fail costs {HEALTH.fail}. Nothing is weighted in secret.
            </p>

            <div className="mt-5 grid gap-2.5 border-t border-line pt-5 sm:grid-cols-2">
              <Meta I={BadgeCheck} k="Inspector" v={inspector ? `${inspector.name} · verified` : "—"} />
              <Meta I={KeyRound} k="Entered with OTP" v={`${r.otpAt} · shared by you`} />
              <Meta I={Clock} k="On site" v={r.onSite} />
              <Meta I={MapPin} k="GPS" v={r.gps} />
              <Meta I={Video} k="Video" v={r.videos} />
              <Meta I={Check} k="Delivered" v={fmtDateTime(r.publishedAt)} />
            </div>
          </Panel>

          {/* what the inspector actually said */}
          <div className="grid gap-4">
            <div className="on-dark card bg-ink p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-white">In the inspector's words</span>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-white/80">{fmtDate(v.scheduledFor, { year: true })}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">{r.summary}</p>
              {inspector && (
                <div className="mt-4 flex items-center gap-2.5 border-t border-white/12 pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-[12px] font-semibold text-white">{inspector.initials}</span>
                  <div><div className="text-[13.5px] font-medium text-white">{inspector.name}</div><div className="text-[12px] text-white/50">{inspector.bg}</div></div>
                </div>
              )}
            </div>

            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">Exit walkthrough</span>
                <span className="chip">filmed before leaving</span>
              </div>
              <p className="t-small mt-1">Every room, wardrobes closed, gas off, main door locked.</p>
              <VideoTile title="Whole home" dur="1:12" variant="living" className="mt-3" />
              <Link href="/app/help" className="t-small mt-3 flex items-center justify-between rounded-[12px] bg-paper px-4 py-3 transition hover:bg-beige">
                <span>Something wrong with this visit?</span><span className="font-medium text-accent">Tell us →</span>
              </Link>
            </Panel>
          </div>
        </div>
      </Reveal>

      {/* ── decisions ──────────────────────────────────────── */}
      {open.length > 0 && (
        <Reveal delay={0.05} className="mt-6">
          <div className="flex items-center gap-2.5 pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-fail-soft text-fail"><Flag size={15} /></span>
            <h2 className="serif text-[22px] tracking-[-0.03em]">{open.length} {open.length === 1 ? "issue needs" : "issues need"} your decision</h2>
          </div>
          <div className="grid gap-4">{open.map((i) => <IssueCard key={i.id} issue={i} />)}</div>
        </Reveal>
      )}

      {settled.length > 0 && (
        <Reveal delay={0.05} className="mt-6">
          <h2 className="serif pb-3 text-[22px] tracking-[-0.03em]">Already decided</h2>
          <div className="grid gap-4">{settled.map((i) => <IssueCard key={i.id} issue={i} />)}</div>
        </Reveal>
      )}

      {/* ── room by room ───────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <div className="flex items-end justify-between pb-3">
          <h2 className="serif text-[22px] tracking-[-0.03em]">Room by room</h2>
          <span className="t-small">{r.rooms.length} areas · {total} items</span>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {r.rooms.map((room, n) => {
          const worst: ItemState = room.items.some((i) => i.s === "fail") ? "fail" : room.items.some((i) => i.s === "attn") ? "attn" : "pass";
          return (
            <Reveal key={room.name} delay={0.02 * n}>
              <Panel className="h-full p-4">
                <VideoTile title={room.name} dur={room.dur} variant={room.variant} tone={worst} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-medium">{room.name}</span>
                  <span className={cn("shrink-0", chipOf(worst))}>{labelOf(worst)}</span>
                </div>
                <ul className="mt-2 divide-y divide-line">
                  {room.items.map((it) => (
                    <li key={it.t} className="py-2">
                      <div className="flex items-center justify-between gap-3 text-[13.5px]">
                        <span className="min-w-0 truncate">{it.t}</span>
                        <span className={cn("shrink-0", chipOf(it.s))}>{labelOf(it.s)}</span>
                      </div>
                      {it.note && <p className="mt-1 text-[12.5px] leading-snug text-text-2">{it.note}</p>}
                    </li>
                  ))}
                </ul>
              </Panel>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-6">
        <Panel>
          <PanelHead title="Where this report came from" meta="The chain nobody can edit after the fact" />
          <ol className="grid gap-px bg-line sm:grid-cols-4">
            {[
              ["OTP shared", `${r.otpAt} — by you`],
              ["Inspector entered", `${r.onSite.split(" → ")[0]} · GPS matched`],
              ["Checklist submitted", r.onSite.split(" → ")[1] ?? "—"],
              ["Report delivered", fmtDateTime(r.publishedAt)],
            ].map(([k, val]) => (
              <li key={k} className="bg-white px-5 py-4">
                <div className="t-label">{k}</div>
                <div className="mt-1 text-[13.5px] font-medium tabular-nums">{val}</div>
              </li>
            ))}
          </ol>
          <p className="t-small border-t border-line px-5 py-3.5">
            Visit {v.ref} · {fmtDayDate(v.scheduledFor)} · every photograph GPS- and time-stamped, stored privately, visible only to you.
          </p>
        </Panel>
      </Reveal>
    </>
  );
}

function Meta({ I, k, v }: { I: typeof Clock; k: string; v: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={14} /></span>
      <span className="text-text-2">{k}</span>
      <span className="ml-auto truncate font-medium tabular-nums">{v}</span>
    </div>
  );
}

function VideoTile({ title, dur, variant, className, tone }: { title: string; dur: string; variant: "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living"; className?: string; tone?: ItemState }) {
  return (
    <div className={cn("relative", className)}>
      <EvidenceFrame variant={variant} id="" room={title} time={dur} tone={tone === "attn" ? "attn" : tone === "fail" ? "fail" : "pass"} ratio="16 / 10" dense />
      <span className="absolute left-1/2 top-[42%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink"><Play size={16} className="ml-0.5 fill-ink" /></span>
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white"><Video size={10} /> {dur}</span>
    </div>
  );
}
