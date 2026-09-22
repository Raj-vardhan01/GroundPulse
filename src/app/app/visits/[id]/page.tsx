import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, ClipboardList, Clock, FileText,
  KeyRound, MapPin, MessageSquare, Phone, Star, Video,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { visitView } from "@/lib/queries";
import { Panel, PanelHead, StatusPill, money, visitLook } from "@/components/app/ui";
import { VisitActions } from "@/components/app/VisitActions";
import { Reveal } from "@/components/ui/Reveal";
import { blocksFor, itemCount } from "@/lib/checklist";
import { fmtDayDate, fmtTime, relative } from "@/lib/format";
import { quote } from "@/lib/quote";
import { cn } from "@/lib/cn";
import type { VisitStatus } from "@/lib/types";

/* The five things that happen to a visit, in the order they happen. */
const TRACK: { s: VisitStatus; t: string; b: string }[] = [
  { s: "scheduled", t: "Booked", b: "We have the day and the window" },
  { s: "assigned", t: "Inspector assigned", b: "Name, photo and record shared with you" },
  { s: "en_route", t: "On the way", b: "You get a message when they leave" },
  { s: "on_site", t: "On site", b: "Entered with your OTP, walking the checklist" },
  { s: "ready", t: "Report delivered", b: "Within the hour of them leaving" },
];
const ORDER: VisitStatus[] = ["scheduled", "assigned", "en_route", "on_site", "submitted", "ready", "closed"];

export default async function Page({ params, searchParams }: PageProps<"/app/visits/[id]">) {
  const user = await requireOwner();
  const { id } = await params;
  const sp = await searchParams;
  const view = await visitView(user.id, id);
  if (!view) notFound();

  const { visit: v, property: p, inspector, report } = view;
  const reached = ORDER.indexOf(v.status);
  const look = visitLook(v.status);
  const q = quote({ kind: v.kind, planId: v.planId, size: p.size, tierId: v.tierId, addOns: v.addOns });
  const blocks = blocksFor(p);
  const movable = ["scheduled", "assigned"].includes(v.status);

  return (
    <>
      <Link href="/app/visits" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> Visits</Link>

      {sp.new === "1" && (
        <Reveal className="mb-4">
          <div className="card flex items-center gap-3 border border-pass/30 bg-pass-soft p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pass text-white"><Check size={16} strokeWidth={3} /></span>
            <p className="text-[14.5px] font-medium text-[#157a44]">Booked. We are finding an inspector for that window now — you will get their name and record before the day.</p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="grow basis-[15rem]">
              <div className="t-label font-mono">{v.ref}</div>
              <h1 className="serif mt-1 text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">
                {v.kind === "cleaning" ? "Cleaning" : v.kind === "plot" ? "Plot visit" : "Inspection"} · {p.label}
              </h1>
              <div className="t-small mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {fmtDayDate(v.scheduledFor)} · {v.slot}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12} /> {p.address}</span>
              </div>
            </div>
            <StatusPill status={v.status} />
          </div>

          {/* ── the track ────────────────────────────────── */}
          <div className="border-t border-line px-6 py-6">
            <ol className="grid gap-0 sm:grid-cols-5">
              {TRACK.map((step, i) => {
                const at = ORDER.indexOf(step.s);
                const done = reached >= at && v.status !== "cancelled";
                const current = (step.s === "ready" ? reached >= ORDER.indexOf("ready") : reached === at) || (step.s === "on_site" && v.status === "submitted");
                return (
                  <li key={step.s} className="relative flex gap-3 pb-6 sm:block sm:pb-0">
                    <div className="flex flex-col items-center sm:flex-row">
                      <span className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition",
                        done ? "bg-accent text-white" : "bg-beige-2 text-text-3", current && look.live && "ring-4 ring-accent/15")}>
                        {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn("w-px flex-1 sm:h-px sm:w-full", done && reached > at ? "bg-accent" : "bg-line", "sm:mx-1")} />
                    </div>
                    <div className="pb-1 sm:mt-3 sm:pr-3">
                      <div className={cn("text-[13.5px] font-semibold", done ? "text-ink" : "text-text-3")}>{step.t}</div>
                      <div className="t-small mt-0.5 leading-snug">{step.b}</div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {v.status === "on_site" && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-accent-tint p-4">
                <span className="ping relative h-2 w-2 rounded-full bg-accent text-accent" />
                <p className="min-w-0 flex-1 text-[14px] text-accent-2">
                  Entered at {v.startedAt ? fmtTime(v.startedAt) : "—"} with your OTP. Walking {itemCount(p)} items across {blocks.length} areas — the report follows within the hour.
                </p>
              </div>
            )}
            {v.status === "ready" && report && (
              <Link href={`/app/reports/${report.id}` as Route} className="btn btn-accent mt-4 w-full sm:w-auto"><FileText size={16} /> Open the report <ArrowRight size={15} /></Link>
            )}
          </div>

          {movable && <VisitActions id={v.id} slot={v.slot} />}
        </Panel>
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-4">
          {/* ── who is coming ─────────────────────────────── */}
          <Reveal>
            <Panel>
              <PanelHead title="Your inspector" meta={inspector ? "Police-verified · background checked" : "Being assigned"} />
              {inspector ? (
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-[17px] font-semibold text-white">{inspector.initials}</span>
                    <div className="grow basis-[15rem]">
                      <div className="flex items-center gap-1.5 text-[17px] font-semibold">{inspector.name} <BadgeCheck size={16} className="text-accent" /></div>
                      <div className="t-small mt-0.5">{inspector.bg} · with us since {inspector.since}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1 text-[15px] font-medium tabular-nums"><Star size={13} className="fill-gold text-gold" /> {inspector.rating}</div>
                      <div className="t-small">{inspector.visits} visits</div>
                    </div>
                  </div>
                  <div className="t-small mt-4 rounded-[12px] bg-paper p-3.5 leading-relaxed">
                    Works {inspector.area}. On the day, they open with an OTP you receive — nobody has a key they did not get from you.
                  </div>
                  {["en_route", "on_site"].includes(v.status) && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a href="tel:+918000000000" className="btn btn-white btn-sm"><Phone size={14} /> Call</a>
                      <a href="sms:+918000000000" className="btn btn-white btn-sm"><MessageSquare size={14} /> Message</a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="t-small px-5 py-8 text-center">We assign by locality, not by whoever is free — so this takes a day or two. You will see their name, record and rating here before the visit.</p>
              )}
            </Panel>
          </Reveal>

          {/* ── what they will walk ───────────────────────── */}
          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="What gets checked" meta={`${blocks.length} areas · ${itemCount(p)} items`} />
              <ul className="grid gap-px bg-line sm:grid-cols-2">
                {blocks.map((b) => (
                  <li key={b.name} className="bg-white px-5 py-3.5">
                    <div className="flex items-center gap-2 text-[14px] font-medium"><ClipboardList size={13} className="text-accent" /> {b.name}</div>
                    <div className="t-small mt-1 leading-snug">{b.items.join(" · ")}</div>
                  </li>
                ))}
              </ul>
              {v.liveCall && (
                <div className="flex items-center gap-2.5 border-t border-line px-5 py-3.5 text-[13.5px] text-accent-2">
                  <Video size={15} className="text-accent" /> You asked for a live call during this visit — the inspector will ring you from inside.
                </div>
              )}
              {v.notes && (
                <div className="border-t border-line px-5 py-4">
                  <div className="t-label">Your instructions</div>
                  <p className="mt-1 text-[14.5px] leading-relaxed">{v.notes}</p>
                </div>
              )}
            </Panel>
          </Reveal>
        </div>

        <div className="grid gap-4 self-start">
          <Reveal>
            <Panel>
              <PanelHead title="What this costs" meta={v.paid ? "Paid" : v.amountInr ? "Due after the visit" : "On your plan"} />
              <div className="p-5">
                <ul className="grid gap-3">
                  {q.lines.map((l) => (
                    <li key={l.k} className="flex items-start justify-between gap-3">
                      <span className="min-w-0"><span className="block text-[14px] font-medium">{l.k}</span><span className="t-small block leading-snug">{l.note}</span></span>
                      <span className="shrink-0 text-[14px] font-medium tabular-nums">{money(l.v)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-[14px] font-medium">Total</span>
                  <span className="text-[22px] font-medium tabular-nums tracking-[-0.03em]">{v.amountInr ? money(v.amountInr) : "Included"}</span>
                </div>
                <Link href="/app/billing" className="btn btn-white btn-sm mt-4 w-full">See billing</Link>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="Getting in" meta={p.label} />
              <div className="grid gap-4 px-5 py-4">
                <div>
                  <div className="t-label">Access</div>
                  <p className="mt-1 text-[14.5px] leading-relaxed">{p.accessNote || <span className="text-text-3">Nothing noted.</span>}</p>
                </div>
                {p.keyHolderName && (
                  <div>
                    <div className="t-label">Key holder</div>
                    <p className="mt-1 flex items-center gap-2 text-[14.5px]"><KeyRound size={14} className="text-text-3" /> {p.keyHolderName} · {p.keyHolderPhone}</p>
                  </div>
                )}
                <Link href={`/app/properties/${p.id}` as Route} className="btn btn-pill btn-sm justify-self-start">Edit these details</Link>
              </div>
            </Panel>
          </Reveal>

          <p className="t-small px-1">
            Booked {relative(v.createdAt)}. Moving or cancelling is free until the day before the visit.
          </p>
        </div>
      </div>
    </>
  );
}
