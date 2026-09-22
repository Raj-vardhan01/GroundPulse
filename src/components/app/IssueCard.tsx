import { BadgeCheck, Check, CircleSlash, Flag, ShieldCheck, Wrench, X } from "lucide-react";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { SubmitButton } from "@/components/app/SubmitButton";
import { decideIssue } from "@/lib/actions";
import { money } from "@/components/app/ui";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Issue } from "@/lib/types";

/* The moment the whole product exists for: photographs, a quote in plain
   numbers, and two buttons. Nothing happens on the property until one of
   them is pressed. */
export function IssueCard({ issue: i }: { issue: Issue }) {
  const open = i.decision === "pending";
  const payable = i.quote ? Math.max(0, i.quote.total - i.coveredInr) : 0;

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
          ? <span className={cn("chip", i.severity === "fail" ? "chip-fail" : "chip-warn")}>{i.severity === "fail" ? "Fail" : "Attention"} · needs you</span>
          : i.decision === "approved"
            ? <span className="chip chip-pass">{i.repair?.status === "completed" ? "Repaired" : "Approved"}</span>
            : <span className="chip">Declined</span>}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <EvidenceFrame variant={i.variant} id={i.ref.replace("ISS-", "")} room={i.room} time="on the day" tone={i.severity === "fail" ? "fail" : "attn"} box={[38, 62, 32, 20]} boxLabel={i.title.split(" ").slice(0, 2).join(" ")} />
            <EvidenceFrame variant={i.variant} id={`${Number(i.ref.replace("ISS-", "")) + 1}`} room="Close-up" time="on the day" tone={i.severity === "fail" ? "fail" : "attn"} box={[20, 36, 58, 42]} boxLabel="Detail" />
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-text-2">{i.body}</p>
        </div>

        <div className="rounded-[14px] bg-paper p-5">
          {i.quote ? (
            <>
              <div className="t-label">Quote from a verified pro · rate card</div>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-[13px] font-semibold text-white">{i.quote.provider.split(" ").map((x) => x[0]).join("")}</span>
                <div>
                  <div className="flex items-center gap-1 text-[14.5px] font-medium">{i.quote.provider} <BadgeCheck size={14} className="text-accent" /></div>
                  <div className="t-small">{i.quote.trade} · verified</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-[14px]">
                <Row k="Labour" v={i.quote.labour} />
                <Row k="Parts" v={i.quote.parts} />
                <Row k="StillYours fee · flat 10%" v={i.quote.fee} />
                {i.coveredInr > 0 && <Row k="Covered by your plan" v={-i.coveredInr} tone="pass" />}
                <div className="flex justify-between border-t border-line pt-2 font-medium">
                  <span>{open ? "You approve" : "You paid"}</span>
                  <span className="tabular-nums">{money(payable)}</span>
                </div>
              </div>
              {i.coveredInr > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-accent-2">
                  <ShieldCheck size={13} className="mt-0.5 shrink-0" /> {money(i.coveredInr)} of this is absorbed by your plan's repair cover.
                </p>
              )}
              <p className="t-small mt-2 leading-snug">Work happens during a scheduled visit with your inspector present. After-photos land back in this report.</p>
            </>
          ) : (
            <p className="t-small">No quote yet — we are getting one from a verified pro and will put it here.</p>
          )}

          {open ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <form action={decideIssue}>
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="decision" value="approve" />
                <SubmitButton className="btn-sm w-full px-2 text-[13.5px]" pendingLabel="Approving…"><Check size={14} /> Approve{i.quote ? ` ${money(payable)}` : ""}</SubmitButton>
              </form>
              <form action={decideIssue}>
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="decision" value="decline" />
                <button className="btn btn-white btn-sm w-full px-2 text-[13.5px]"><X size={14} /> Decline</button>
              </form>
            </div>
          ) : (
            <div className={cn("mt-4 flex items-start gap-2 rounded-[10px] px-3.5 py-3 text-[13.5px] font-medium", i.decision === "approved" ? "bg-pass-soft text-[#157a44]" : "bg-beige text-text-2")}>
              {i.decision === "approved" ? <Check size={15} className="mt-0.5 shrink-0" /> : <CircleSlash size={15} className="mt-0.5 shrink-0" />}
              <span>
                You {i.decision} this{i.decidedAt ? ` on ${fmtDate(i.decidedAt, { year: true })}` : ""}.
                <span className="block text-[12px] font-normal opacity-80">Written to the audit log · {i.decidedAt ? fmtDateTime(i.decidedAt) : ""}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {i.repair && (
        <div className="border-t border-line p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Wrench size={15} /></span>
            <div className="grow basis-[15rem]">
              <div className="text-[14.5px] font-medium">{i.repair.providerName} · {i.repair.trade}</div>
              <div className="t-small">{i.repair.completedAt ? `Completed ${fmtDate(i.repair.completedAt, { year: true })}` : `Scheduled ${fmtDate(i.repair.scheduledFor, { year: true })}`}</div>
            </div>
            <span className={cn("chip", i.repair.status === "completed" ? "chip-pass" : "chip-accent")}>
              {{ requested: "Requested", assigned: "Assigned", in_progress: "In progress", completed: "Done" }[i.repair.status]}
            </span>
          </div>
          {i.repair.completedAt && (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.6fr]">
              <EvidenceFrame variant={i.variant} dense id="AFTER" room="Fixed" time="after" tone="pass" box={[38, 62, 32, 20]} boxLabel="Fixed" />
              <div className="rounded-[12px] border border-line p-3.5">
                <div className="t-label">Completion note</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-text-2">{i.repair.note}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Row({ k, v, tone }: { k: string; v: number; tone?: "pass" }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-2">{k}</span>
      <span className={cn("tabular-nums", tone === "pass" && "text-pass")}>{v < 0 ? `− ${money(-v)}` : money(v)}</span>
    </div>
  );
}
