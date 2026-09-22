import Link from "next/link";
import { CreditCard, Download, IndianRupee, ShieldCheck } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { invoices, properties } from "@/lib/queries";
import { payInvoice } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { Empty, PageHead, Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Billing" };

export default async function Page() {
  const user = await requireOwner();
  const [all, props] = await Promise.all([invoices(user.id), properties(user.id)]);
  const label = (id: string) => props.find((p) => p.id === id)?.label ?? "";
  const due = all.filter((i) => i.status === "due");
  const paid = all.filter((i) => i.status === "paid");
  const spent = paid.reduce((n, i) => n + i.amountInr, 0);

  return (
    <>
      <PageHead
        eyebrow="Money, plainly"
        title="Billing"
        lede="Nothing is charged before a visit happens, and no repair appears here that you did not approve first."
      />

      {all.length === 0 ? (
        <Panel><Empty icon={CreditCard} title="Nothing billed yet." body="Bills appear after a visit is done, or when you approve a repair. Never before." /></Panel>
      ) : (
        <div className="grid gap-4">
          <Reveal>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat n={money(due.reduce((n, i) => n + i.amountInr, 0))} l="Payable now" tone={due.length ? "warn" : undefined} className="border border-line bg-white shadow-card" />
              <Stat n={money(spent)} l="Paid so far" className="border border-line bg-white shadow-card" />
              <Stat n={all.length} l="Bills in total" className="col-span-2 border border-line bg-white shadow-card sm:col-span-1" />
            </div>
          </Reveal>

          {due.length > 0 && (
            <Reveal delay={0.04}>
              <Panel>
                <PanelHead title="Payable now" meta="Pay whenever suits you — nothing stops while it is open" />
                <ul className="divide-y divide-line">
                  {due.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><IndianRupee size={16} /></span>
                      <div className="grow basis-[15rem]">
                        <div className="truncate text-[14.5px] font-medium">{i.title}</div>
                        <div className="t-small mt-0.5 truncate font-mono">{i.ref} · {label(i.propertyId)} · raised {relative(i.createdAt)}</div>
                        {i.method && <div className="t-small mt-0.5 flex items-center gap-1 text-accent-2"><ShieldCheck size={11} /> {i.method}</div>}
                      </div>
                      <span className="shrink-0 text-[17px] font-medium tabular-nums">{money(i.amountInr)}</span>
                      <form action={payInvoice} className="shrink-0">
                        <input type="hidden" name="id" value={i.id} />
                        <SubmitButton className="btn-sm" pendingLabel="Recording…">Mark paid</SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
                <p className="t-small border-t border-line px-5 py-3.5">
                  No payment gateway is wired up locally, so this records the payment against the bill. Razorpay slots in behind this same button.
                </p>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={0.06}>
            <Panel>
              <PanelHead title="History" meta={`${paid.length} paid`} />
              {paid.length === 0 ? <p className="t-small px-5 py-8 text-center">Nothing paid yet.</p> : (
                <ul className="divide-y divide-line">
                  {paid.map((i) => (
                    <li key={i.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pass-soft text-pass"><CreditCard size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-medium">{i.title}</div>
                        <div className="t-small mt-0.5 truncate font-mono">{i.ref} · {fmtDate(i.createdAt, { year: true })} · {i.method}</div>
                      </div>
                      <span className="shrink-0 text-[15px] font-medium tabular-nums">{money(i.amountInr)}</span>
                      <span className={cn("chip chip-pass shrink-0")}>Paid</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel className="flex flex-wrap items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Download size={17} /></span>
              <p className="min-w-0 flex-1 text-[14px] text-text-2">Need a GST invoice or a statement for your accountant? Ask and we will send it for any period.</p>
              <Link href="/app/help" className="btn btn-pill btn-sm shrink-0">Ask us</Link>
            </Panel>
          </Reveal>
        </div>
      )}
    </>
  );
}
