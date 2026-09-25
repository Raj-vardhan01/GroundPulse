import { BadgeCheck, CalendarClock, Check, CircleSlash, Flag, Hourglass, ShieldCheck, Wrench } from "lucide-react";
import { DecisionButtons } from "@/components/app/DecisionButtons";
import { RepairScheduler } from "@/components/app/RepairScheduler";
import { RateRepair } from "@/components/app/RateRepair";
import { PhotoStrip } from "@/components/app/PhotoStrip";
import { VideoClip } from "@/components/app/VideoClip";
import { money } from "@/components/app/ui";
import { fmtDate, fmtDateTime, fmtDayDate } from "@/lib/format";
import { FEE_RATE, repairBill } from "@/lib/repair";
import { carePlusCover } from "@/lib/pricing";
import { effectiveStatus } from "@/lib/plans";

import { Countdown } from "@/components/app/Countdown";
import { cn } from "@/lib/cn";
import type { Invoice, Issue, Subscription } from "@/lib/types";

const FEE_PCT = Math.round(FEE_RATE * 100);

/* How an issue that nobody decided reads. */
const CLOSED = {
  expired: { chip: "Closed · time ran out", body: "No decision within the hour, so nothing was done. It stays on your report — ask us from Help if you want it done." },
  visit_closed: { chip: "Closed with the visit", body: "The visit closed before a decision, so nothing was done. It stays on your report — ask us from Help if you want it done." },
  not_sent: { chip: "On the record", body: "Noted on the report, not offered for a repair on this visit. Ask us from Help if you want it done." },
} as const;

/* The moment the whole product exists for: photographs, a quote in plain
   numbers, and two buttons. Nothing happens on the property until one of
   them is pressed — and nothing can be approved before there is a price. */
export function IssueCard({
  issue: i, founding, sub, invoice, tz, shared = false,
}: {
  issue: Issue;
  /** raised on a launch-offer visit: no StillYours fee on the repair */
  founding: boolean;
  sub: Subscription | null;
  /** the bill raised when it was approved */
  invoice?: Invoice;
  tz: string;
  /** the read-only family link — no prices, no buttons */
  shared?: boolean;
}) {
  const open = i.decision === "pending";
  const bill = repairBill(i, { founding, sub });
  /* The rate the quote was written at — a quote made before a rate change
     keeps its own number, and says so. */
  const gross = (i.quote?.labour ?? 0) + (i.quote?.parts ?? 0);
  const pct = i.quote && gross ? `${Math.round((i.quote.fee / gross) * 100)}%` : `${FEE_PCT}%`;
  const r = i.repair;

  return (
    <article id={i.id} className={cn("card scroll-mt-24 border bg-white shadow-card", open ? (i.severity === "fail" ? "border-fail/30" : "border-warn/30") : "border-line")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid h-9 w-9 place-items-center rounded-full", i.severity === "fail" ? "bg-fail-soft text-fail" : "bg-warn-soft text-warn")}><Flag size={15} /></span>
          <div>
            <div className="text-[16px] font-semibold tracking-[-0.015em]">{i.title}</div>
            <div className="t-small font-mono">{i.ref} · {i.room}</div>
          </div>
        </div>
        {open
          ? <span className={cn("chip", i.severity === "fail" ? "chip-fail" : "chip-warn")}>{i.severity === "fail" ? "Fail" : "Attention"} · {i.decideBy ? "decide now" : i.quote ? "needs you" : "being quoted"}</span>
          : i.decision === "approved"
            ? r?.status === "cancelled"
              ? <span className="chip">Cancelled · refunded</span>
              : <span className="chip chip-pass">{r?.status === "completed" ? "Repaired" : r?.status === "in_progress" ? "Being done now" : "Approved"}</span>
            : i.decision === "closed"
              ? <span className="chip">{CLOSED[i.closedWhy ?? "expired"].chip}</span>
              : <span className="chip">Declined</span>}
      </div>

      <div className={cn("grid gap-5 p-5", !shared && "lg:grid-cols-2")}>
        <div>
          {i.photos.length || i.videos.length ? (
            <div className="grid gap-3">
              {i.videos.map((v, n) => <VideoClip key={v.key} v={v} label={`${i.title} · clip ${n + 1}`} />)}
              {i.photos.length > 0 && <PhotoStrip photos={i.photos} label={`${i.room} · ${i.title}`} size={92} />}
              <p className="t-small">The inspector&apos;s own photos and clips, taken live on the camera — tap to see them full size, with where and when.</p>
            </div>
          ) : (
            <p className="t-small rounded-[12px] bg-paper px-4 py-3">No photo or clip is attached to this one.</p>
          )}
          <p className="mt-3 text-[14.5px] leading-relaxed text-text-2">{i.body}</p>
        </div>

        {!shared && (
          <div className="rounded-[14px] bg-paper p-5">
            {i.quote && bill ? (
              <>
                <div className="t-label">{i.quote.source === "urban-company" ? "Priced at Urban Company's rate · plus our 15%" : "Quote from a verified pro · rate card"}</div>
                <div className="mt-2.5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-[13px] font-semibold text-white">{i.quote.provider.split(" ").map((x) => x[0]).join("")}</span>
                  <div>
                    <div className="flex items-center gap-1 text-[14.5px] font-medium">{i.quote.provider} {i.quote.source !== "urban-company" && <BadgeCheck size={14} className="text-accent" />}</div>
                    <div className="t-small">{i.quote.trade} · {i.quote.source === "urban-company" ? "price checked by your inspector" : "verified"}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-[14px]">
                  {i.quote.source === "urban-company"
                    ? <><Row k={`Urban Company · ${i.quote.trade}`} v={bill.labour} />{bill.parts > 0 && <Row k="Parts, at their rate card" v={bill.parts} />}</>
                    : <><Row k="Labour" v={bill.labour} /><Row k="Parts" v={bill.parts} /></>}
                  {bill.feeCovered
                    ? <Row k={`StillYours ${pct} · none under Care+`} v={0} was={bill.feeCovered} />
                    : bill.feeWaived
                      ? <Row k={`StillYours ${pct} · waived, launch offer`} v={0} was={bill.feeWaived} />
                      : <Row k={`StillYours ${pct} · we arrange it and stay for it`} v={bill.fee} />}
                  {bill.covered > 0 && <Row k="Covered by Care+" v={-bill.covered} tone="pass" />}
                  <div className="flex justify-between border-t border-line pt-2 font-medium">
                    <span>{open ? "Total you pay" : "Your share"}</span>
                    <span className="tabular-nums">{money(bill.payable)}</span>
                  </div>
                </div>
                {bill.covered > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-accent-2">
                    <ShieldCheck size={13} className="mt-0.5 shrink-0" /> {money(bill.covered)} of this is absorbed by your plan&apos;s repair cover{open ? ", from what is left of it this year" : ""} — the work in full, parts up to {money(carePlusCover.partsPerIncident)}, at most {money(carePlusCover.perIncident)} a repair. No fee on it.
                  </p>
                )}
                {sub?.planId === "care-plus" && !i.coverEligible && (
                  <p className="t-small mt-2 leading-snug">Not under the Care+ cover — it is excluded work (appliances, structural) or was flagged on the plan&apos;s first visit.</p>
                )}
                {sub?.planId === "care-plus" && i.coverEligible && open && bill.covered === 0 && effectiveStatus(sub) === "active" && (
                  <p className="t-small mt-2 leading-snug">This year&apos;s Care+ cover of {money(carePlusCover.yearly)} is used up, so this one is priced as usual.</p>
                )}
                <p className="t-small mt-2 leading-snug">
                  {i.quote.source === "urban-company" ? "The same service costs this on Urban Company today — your inspector checked. " : ""}
                  {i.sentAt
                    ? "Paid when you approve. It is done on this visit, with your inspector there, and the after-photos land back here. If it cannot be done today — or the professional has not arrived within two hours — it is cancelled and everything you paid comes back."
                    : "Paid when you approve. Work happens on a day you choose, with your inspector present, and the after-photos land back in this report."}
                </p>
              </>
            ) : (
              <div className="flex items-start gap-2.5">
                <Hourglass size={16} className="mt-0.5 shrink-0 text-warn" />
                <p className="t-small leading-snug">No price on this one yet. You can approve it once there is; you can decline it now if you would rather leave it.</p>
              </div>
            )}

            {open ? (
              <>
                {i.decideBy && (
                  <p className="mt-4 flex flex-wrap items-center gap-1.5 rounded-[10px] bg-warn-soft px-3.5 py-2.5 text-[13px] text-text-2">
                    <Hourglass size={13} className="shrink-0 text-warn" /> Your inspector is still there — decide within the hour:
                    <Countdown until={i.decideBy} className="font-semibold tabular-nums text-ink" />
                  </p>
                )}
                <DecisionButtons id={i.id} payable={bill?.payable ?? null} canApprove={!!i.quote} />
              </>
            ) : i.decision === "closed" ? (
              <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-beige px-3.5 py-3 text-[13.5px] text-text-2">
                <CircleSlash size={15} className="mt-0.5 shrink-0" />
                <span>{CLOSED[i.closedWhy ?? "expired"].body}</span>
              </div>
            ) : (
              <div className={cn("mt-4 flex items-start gap-2 rounded-[10px] px-3.5 py-3 text-[13.5px] font-medium", i.decision === "approved" ? "bg-pass-soft text-[#157a44]" : "bg-beige text-text-2")}>
                {i.decision === "approved" ? <Check size={15} className="mt-0.5 shrink-0" /> : <CircleSlash size={15} className="mt-0.5 shrink-0" />}
                <span>
                  You {i.decision} this{i.decidedAt ? ` on ${fmtDate(i.decidedAt, { year: true })}` : ""}.
                  {i.decision === "declined" && i.declineReason && (
                    <span className="block text-[12.5px] font-normal italic">“{i.declineReason}” — nothing scheduled, nobody sent.</span>
                  )}
                  {i.decision === "approved" && (
                    <span className="block text-[12.5px] font-normal">
                      {invoice ? `${money(invoice.amountInr)} · ${invoice.status === "paid" ? "paid" : invoice.status === "due" ? "on your bills, due" : invoice.status === "refund_due" ? "being refunded" : "refunded"} (${invoice.ref})` : "Fully covered — nothing to pay."}
                    </span>
                  )}
                  <span className="block text-[12px] font-normal opacity-80">Written to the audit log · {i.decidedAt ? fmtDateTime(i.decidedAt) : ""}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {r && (
        <div className="border-t border-line p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Wrench size={15} /></span>
            <div className="grow basis-[15rem]">
              <div className="text-[14.5px] font-medium">{r.providerName} · {r.trade}</div>
              <div className="t-small">
                {r.status === "cancelled" ? `Could not be done on the visit${r.note ? ` — ${r.note}` : ""}. Cancelled, and refunded in full.`
                  : r.status === "in_progress" ? (r.proArrivedAt ? "The professional is there, with your inspector" : "Being booked now — the professional has two hours to arrive")
                  : r.completedAt ? `Completed ${fmtDate(r.completedAt, { year: true })}`
                  : r.scheduledFor ? `${fmtDayDate(r.scheduledFor)} · ${r.slot} IST${r.status === "requested" ? " — we are confirming the pro for this day" : ""}`
                  : "Choose a day for the work"}
              </div>
            </div>
            <span className={cn("chip", r.status === "completed" ? "chip-pass" : r.status === "cancelled" ? "" : r.scheduledFor ? "chip-accent" : "chip-warn")}>
              {r.status === "completed" ? "Done" : r.status === "cancelled" ? "Refunded" : r.status === "in_progress" ? "In progress" : r.status === "assigned" ? "Confirmed" : r.scheduledFor ? "Day chosen" : <><CalendarClock size={11} className="mr-0.5" />Pick a day</>}
            </span>
          </div>
          {!shared && ["requested", "assigned"].includes(r.status) && (
            <RepairScheduler id={i.id} tz={tz} current={r.scheduledFor ? { date: r.scheduledFor, slot: r.slot } : null} />
          )}
          {r.completedAt && (
            <div className="mt-3 grid gap-3">
              {/* the same wall, before and after — the inspector took the
                  second one lined up on the first */}
              <div className="grid grid-cols-2 gap-2.5">
                {([["Before", i.photos[0] ?? null], ["After · same angle", r.afterPhoto]] as const).map(([k, ph]) => (
                  <div key={k} className="grid gap-1.5">
                    {ph
                      ? <PhotoStrip photos={[ph]} label={`${i.title} · ${k.toLowerCase()}`} size={140} />
                      : <span className="t-small grid h-[140px] place-items-center rounded-[8px] bg-paper px-3 text-center">No photo</span>}
                    <span className="t-label">{k}</span>
                  </div>
                ))}
              </div>
              {r.afterVideo && <VideoClip v={r.afterVideo} label={`${i.title} · after, same angle`} />}
              <div className="rounded-[12px] border border-line p-3.5">
                <div className="t-label">Completion note</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-text-2">{r.note}</p>
              </div>
              {!shared && <RateRepair id={i.id} provider={r.providerName || "the provider"} done={r.rating ?? null} />}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Row({ k, v, tone, was }: { k: string; v: number; tone?: "pass"; was?: number }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-2">{k}</span>
      <span className={cn("shrink-0 tabular-nums", tone === "pass" && "text-pass")}>
        {was !== undefined && <span className="mr-1.5 text-text-3 line-through">{money(was)}</span>}
        {v < 0 ? `− ${money(-v)}` : money(v)}
      </span>
    </div>
  );
}
