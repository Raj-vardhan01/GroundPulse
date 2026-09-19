"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { cn } from "@/lib/cn";

import { InspectMock, RegisterMock, ReportMock, ScheduleMock } from "@/components/shared/Mocks";

const RegisterSchedule = () => <div className="grid gap-3 sm:grid-cols-2"><RegisterMock /><ScheduleMock /></div>;
const InspectReport = () => <div className="grid gap-3 sm:grid-cols-2"><InspectMock /><ReportMock /></div>;

const steps = [
  { n: "01", k: "Register & schedule", t: "Five minutes to your first inspection.", b: "Add the address — a flat, a villa or an empty plot — and list the rooms: bedrooms, bathrooms, kitchen, balconies, parking. Every room becomes a mandatory video slot in the inspector's app. Pick a date and a rhythm, and a verified inspector is assigned automatically.", V: RegisterSchedule },
  { n: "02", k: "Inspect & report", t: "Every room. Every item. Proof attached.", b: "The inspector walks a structured checklist and marks each item Pass, Fail or Attention with photos and video on the spot. For a plot, it's a boundary walk with a GPS-tagged photo of every corner; add a car check for ₹700. The report compiles itself and reaches you within the hour.", V: InspectReport },
];

export function Steps() {
  return (
    <section className="section" aria-labelledby="steps-title">
      <div className="wrap">
        <SectionHead title={<span id="steps-title">Know your home the easy way</span>} lede="Three moves. One record. Home, plot or car — no flight home." action={<Link href="/how-it-works" className="btn btn-accent btn-sm">See all six steps <ArrowRight size={15} /></Link>} />
        <div className="mt-12 grid gap-8 md:mt-16 md:gap-12">
          {steps.map((s, i) => (
            <Reveal key={s.k}>
              <div className={cn("grid items-center gap-8 lg:grid-cols-12 lg:gap-12", i % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-3"><span className="text-[13px] font-semibold text-accent">{s.n}</span><span className="t-label">{s.k}</span></div>
                  <h3 className="t-2 mt-4 max-w-[16ch]">{s.t}</h3>
                  <p className="t-body mt-4 max-w-[44ch] text-text-2">{s.b}</p>
                </div>
                <div className="lg:col-span-8"><div className="panel bg-tint p-4 sm:p-6"><s.V /></div></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
