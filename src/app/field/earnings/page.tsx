import { CalendarDays, Clock3, IndianRupee, Landmark, ShieldCheck } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, earnings } from "@/lib/field";
import { Empty, Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, fmtDayDate, relative } from "@/lib/format";
import { DEPOSIT, hoursWords, OVERTIME, PAY, payLabel, PLOT_PAY, RATES } from "@/lib/payout";
import { HOLD, PENALTY, penaltyLine } from "@/lib/jobs";
import { cn } from "@/lib/cn";
import Link from "next/link";

export const metadata = { title: "Earnings" };

export default async function Earnings() {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const e = await earnings(ins);
  const full = ins.depositInr >= DEPOSIT.target;
  const owed = ins.depositInr < 0;
  const penalties = [...(ins.penalties ?? [])].reverse();

  return (
    <div className="grid gap-4">
      <div>
        <p className="t-label">Paid the same day, by the end of it</p>
        <h1 className="serif mt-1 text-[clamp(1.7rem,6vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">Earnings</h1>
      </div>

      <Reveal>
        <Panel className="p-5">
          <div className="t-label">Today</div>
          <div className="mt-1 text-[38px] font-medium leading-none tabular-nums tracking-[-0.04em]">{money(e.today)}</div>
          <p className="t-small mt-2">
            Reaches <b className="font-mono text-ink">{ins.upiId || "your UPI"}</b> by the end of today.{" "}
            <Link href="/field/record" className="font-medium text-accent underline underline-offset-4">Change UPI</Link>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            <Stat n={money(e.paidOut)} l="Paid out before today" />
            <Stat n={money(e.overtime)} l="Of it, overtime" tone={e.overtime ? "accent" : undefined} />
            <Stat n={e.visits} l="Visits" />
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.04}>
        <Panel>
          <PanelHead title="Every visit" meta={`${e.rows.length} on record`} />
          {e.rows.length === 0 ? (
            <Empty icon={IndianRupee} title="Nothing earned yet." body="Claim a job from the board, finish it, and it shows up here the moment you submit." />
          ) : (
            <ul className="divide-y divide-line">
              {e.rows.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-paper text-center leading-none">
                    <span className="block font-mono text-[13px] font-semibold tabular-nums">{new Date(v.scheduledFor).getDate()}</span>
                    <span className="mt-0.5 block text-[9px] font-semibold uppercase text-text-3">
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date(v.scheduledFor).getMonth()]}
                    </span>
                  </span>
                  <div className="grow basis-[10rem]">
                    <div className="text-[14px] font-medium">{v.ref}</div>
                    <div className="t-small flex items-center gap-1.5"><CalendarDays size={11} /> {fmtDayDate(v.scheduledFor)} · {relative(v.scheduledFor)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[15px] font-medium tabular-nums">{money(e.pay(v))}</div>
                    {v.overtimeInr > 0 && <div className="t-small flex items-center justify-end gap-1 tabular-nums"><Clock3 size={10} /> incl. {money(v.overtimeInr)} overtime</div>}
                    {!!v.depositHeldInr && <div className="t-small flex items-center justify-end gap-1 tabular-nums"><ShieldCheck size={10} /> {money(v.depositHeldInr)} to your deposit</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>

      <Reveal delay={0.06}>
        <Panel>
          <PanelHead title="How a visit is priced" meta="The same rates for everybody" />
          <ul className="grid gap-2 p-5 text-[13.5px]">
            {(["2", "3", "4", "5"] as const).map((size) => (
              <Row key={size} k={`${payLabel(size)} · first ${hoursWords(OVERTIME.included[size])} on site included`} v={PAY[size]} />
            ))}
            <Row k={`Plot · first ${hoursWords(OVERTIME.plot)} included`} v={PLOT_PAY} />
            <Row k="Each car checked" v={RATES.perCar} />
            <Row k="Every hour on site past that" v={OVERTIME.perHour} />
          </ul>
          <p className="t-small border-t border-line px-5 py-3.5 leading-snug">
            A fixed amount by size, not a cut of the price — a visit on a yearly plan, or a free launch-offer visit, costs the owner nothing on the day and pays you the same.
          </p>
        </Panel>
      </Reveal>

      <Reveal delay={0.08}>
        <Panel>
          <div className="flex flex-wrap items-center gap-3 p-5">
            <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", owed ? "bg-fail-soft text-fail" : "bg-accent-tint text-accent")}><ShieldCheck size={17} /></span>
            <div className="grow basis-[13rem]">
              <div className="text-[14.5px] font-medium">Security deposit · {owed ? `${money(-ins.depositInr)} owed` : money(ins.depositInr)}</div>
              <p className="t-small mt-0.5 leading-snug">
                {full
                  ? "Full — nothing more is held from your pay. "
                  : `${money(Math.max(0, ins.depositInr))} of ${money(DEPOSIT.target)} in. Half of each job's pay goes to it until it is full — never your overtime. ${ins.depositInr < DEPOSIT.unlock ? `Until ${money(DEPOSIT.unlock)} is in, you hold ${HOLD.untilUnlock} jobs at a time, not ${HOLD.max}. ` : ""}`}
                It comes back when you leave in good standing and hand the camera back in working order.
              </p>
            </div>
            <span className={cn("chip shrink-0", full ? "chip-pass" : owed ? "chip-fail" : "chip-warn")}><Landmark size={10} className="mr-0.5" />{full ? "Held" : owed ? "Owed" : "Building"}</span>
          </div>
          {penalties.length > 0 && (
            <ul className="divide-y divide-line border-t border-line">
              {penalties.map((p) => (
                <li key={p.id} className="px-5 py-3 text-[13.5px]">
                  <div className="flex justify-between gap-3">
                    <span className={p.waivedAt ? "text-text-3" : undefined}>{penaltyLine(p)}</span>
                    <span className="t-small shrink-0">{fmtDate(p.at)}</span>
                  </div>
                  {p.waivedWhy && <p className="t-small mt-0.5 leading-snug">{p.waivedWhy}{p.refundInr ? ` · ${money(p.refundInr)} sent to your UPI` : ""}</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="t-small border-t border-line px-5 py-3.5 leading-snug">
            Handing a job back inside {PENALTY.freeReleaseHours} hours costs {money(PENALTY.lateRelease)}; a missed visit costs {money(PENALTY.noShow)}. Missed one for a real emergency? Tell ops — a deduction can be taken back.
          </p>
        </Panel>
      </Reveal>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: number }) => (
  <li className="flex justify-between gap-3">
    <span className="text-text-2">{k}</span>
    <span className="shrink-0 tabular-nums">{money(v)}</span>
  </li>
);
