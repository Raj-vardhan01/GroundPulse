import Link from "next/link";
import type { Route } from "next";
import { Camera, Check, CircleSlash, Clock3, Hourglass, Send, Undo2, UserCheck } from "lucide-react";
import { cancelRepair, proArrived } from "@/lib/fieldActions";
import { proDueBy } from "@/lib/liveRepairs";
import { Countdown } from "@/components/app/Countdown";
import { AutoRefresh } from "@/components/app/AutoRefresh";
import { money } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import type { Issue } from "@/lib/types";

/* What the inspector has sent to the owner from this visit, and where each
   one stands: waiting (with the hour ticking), approved — so do it now —,
   declined, or closed. Refreshes itself while anything is waiting. */
export function LiveDecisions({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  const waiting = issues.some((i) => i.decision === "pending" || i.repair?.status === "in_progress");
  return (
    <div className="card border border-accent/25 bg-white p-4 shadow-card">
      {waiting && <AutoRefresh every={15} />}
      <div className="flex items-center gap-2 text-[14.5px] font-semibold"><Send size={15} className="text-accent" /> Sent to the owner</div>
      <ul className="mt-3 grid gap-2.5">
        {issues.map((i) => (
          <li key={i.id} className={cn("rounded-[12px] border p-3.5", i.decision === "approved" ? "border-pass/30 bg-pass-soft" : i.decision === "pending" ? "border-warn/30 bg-warn-soft" : "border-line bg-paper")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[14px] font-medium">{i.title} <span className="t-small font-normal">· {i.room}</span></span>
              {i.quote && <span className="text-[13.5px] font-medium tabular-nums">{money(i.quote.total)}</span>}
            </div>
            <Status i={i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Status({ i }: { i: Issue }) {
  if (i.decision === "pending") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text-2">
        <Hourglass size={13} className="text-warn" /> Waiting for the owner ·{" "}
        {i.decideBy ? <Countdown until={i.decideBy} className="font-medium tabular-nums text-ink" /> : null}. Ring them and explain.
      </p>
    );
  }
  if (i.decision === "declined") {
    return <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-text-2"><CircleSlash size={13} className="mt-0.5 shrink-0" /> Declined{i.declineReason ? ` — “${i.declineReason}”` : ""}. Leave it as it is.</p>;
  }
  if (i.decision === "closed") {
    return <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text-2"><Clock3 size={13} /> Closed — no decision within the hour. Leave it as it is.</p>;
  }
  const r = i.repair;
  if (r?.status === "completed") return <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#157a44]"><Check size={13} /> Approved and done.</p>;
  if (r?.status === "cancelled") return <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-text-2"><Undo2 size={13} className="mt-0.5 shrink-0" /> Could not be done — cancelled, and the owner refunded in full.{r.note ? ` (${r.note})` : ""} Cancel it on Urban Company too.</p>;
  if (r?.status === "in_progress") {
    const due = new Date(proDueBy(i)).toISOString();
    return (
      <div className="mt-2 grid gap-2">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#157a44]"><Check size={13} /> Approved and paid — book it on Urban Company now and stay for it.</p>
        {r.proArrivedAt ? (
          <p className="flex items-center gap-1.5 text-[13px] text-text-2"><UserCheck size={13} className="text-accent" /> The professional is here.</p>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-text-2">
              <Hourglass size={13} className="text-warn" /> The professional has to arrive within two hours —
              <Countdown until={due} className="font-medium tabular-nums text-ink" />. After that it is cancelled and refunded on its own.
            </p>
            <form action={proArrived}>
              <input type="hidden" name="id" value={i.id} />
              <button className="btn btn-white btn-sm w-full"><UserCheck size={14} /> The professional has arrived</button>
            </form>
          </>
        )}
        <Link href={`/field/repair/${i.id}` as Route} className="btn btn-accent btn-sm w-full"><Camera size={14} /> Record the after photo when it is done</Link>
        <form action={cancelRepair} className="grid gap-1.5">
          <input type="hidden" name="id" value={i.id} />
          <input name="why" required minLength={6} maxLength={300} placeholder="Why it cannot be done today — e.g. the part is not in stock"
            className="h-10 w-full rounded-[10px] border border-line-2 bg-white px-3 text-[13px] outline-none focus:border-accent" />
          <button className="btn btn-white btn-sm w-full"><Undo2 size={14} /> Cannot be done today — cancel and refund</button>
        </form>
        <p className="t-small leading-snug">Nobody comes back another day for it: the owner gets everything back, our fee too. Cancel the booking on Urban Company as well — any charge they make is ours, not the owner&apos;s.</p>
      </div>
    );
  }
  return <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-text-2"><Clock3 size={13} /> Approved.</p>;
}
