import { CalendarDays, Clock3, IndianRupee, Landmark, ShieldCheck } from "lucide-react";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, earnings } from "@/lib/field";
import { Empty, Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDayDate, relative } from "@/lib/format";
import { OVERTIME, RATES } from "@/lib/payout";
import Link from "next/link";

export const metadata = { title: "Earnings" };

export default async function Earnings() {
  const user = await requireInspector();
  const ins = (await inspectorFor(user.id))!;
  const e = await earnings(ins);

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
            <Row k="Turning up, entry checks, exit walkthrough" v={RATES.base} />
            <Row k="Every room block on the checklist" v={RATES.perRoom} />
            <Row k="A plot boundary walk" v={RATES.plot} />
            <Row k="Staying with a cleaning crew" v={RATES.cleaningSupervision} />
            <Row k="Each car checked" v={RATES.perCar} />
            <Row k="Wearing the body camera" v={RATES.camera} />
            <Row k={`Every hour on site past the first ${OVERTIME.freeMinutes / 60}`} v={OVERTIME.perHour} />
          </ul>
          <p className="t-small border-t border-line px-5 py-3.5 leading-snug">
            Paid for the work, not as a cut of the price — a visit on a yearly plan costs the owner nothing on the day, and pays you the same.
          </p>
        </Panel>
      </Reveal>

      {ins.depositInr > 0 && <Reveal delay={0.08}>
        <Panel className="flex flex-wrap items-center gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><ShieldCheck size={17} /></span>
          <div className="grow basis-[13rem]">
            <div className="text-[14.5px] font-medium">Security deposit · {money(ins.depositInr)}</div>
            <p className="t-small mt-0.5 leading-snug">₹500 held from each of your first three payouts — returned in full when you leave and hand the camera back in working order.</p>
          </div>
          <span className="chip chip-pass shrink-0"><Landmark size={10} className="mr-0.5" />Held</span>
        </Panel>
      </Reveal>}
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: number }) => (
  <li className="flex justify-between gap-3">
    <span className="text-text-2">{k}</span>
    <span className="shrink-0 tabular-nums">{money(v)}</span>
  </li>
);
