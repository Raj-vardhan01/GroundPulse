import type { Metadata } from "next";
import { Bath, BedDouble, Car, ChefHat, DoorOpen, Fan, LandPlot, Sofa, Sun, Zap } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { FeatureRow } from "@/components/shared/FeatureRow";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { DecideMock, InspectMock, RegisterMock, ReportMock, ResolveMock, ScheduleMock } from "@/components/shared/Mocks";
import { CTA } from "@/components/home/CTA";
import { WhenWrong } from "@/components/home/WhenWrong";
import { Health } from "@/components/home/Health";
import { Pocket } from "@/components/home/Pocket";
import { Handles } from "@/components/home/Handles";
import { BetaNote } from "@/components/shared/BetaNote";

export const metadata: Metadata = {
  title: "How Our Home Inspection Works, Step by Step",
  description:
    "Add your property, pick a date, and a verified inspector checks every room. Photo-and-video report within an hour. Repairs only if you approve.",
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How Our Home Inspection Works, Step by Step | StillYours", description: "Add your property, pick a date, and a verified inspector checks every room. Photo-and-video report within an hour. Repairs only if you approve.", url: "/how-it-works" },
};

const rooms = [
  { I: DoorOpen, t: "Entrance & hallway", b: "Locks, door frame, letterbox, signs of entry" },
  { I: Sofa, t: "Living room", b: "Walls, ceiling, damp, windows, fittings" },
  { I: ChefHat, t: "Kitchen", b: "Sink & plumbing, gas connection, chimney, cabinets" },
  { I: BedDouble, t: "Bedrooms", b: "Window locks, wardrobes, AC units, ceiling" },
  { I: Bath, t: "Bathrooms", b: "Taps, traps, seepage, drainage, geyser" },
  { I: Sun, t: "Balcony & exterior", b: "Railing, drainage, paint, cracks, pests" },
  { I: Zap, t: "Electrical & safety", b: "MCB panel, sockets, wiring, smoke, meter" },
  { I: Fan, t: "Utilities", b: "Water supply, tank, inverter, society dues" },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="How it works" title={<>How StillYours works,<br className="hidden md:block" /> in six steps</>} lede="Home, plot or car — every step is visible to you the moment it happens, from the address you type to the after-photo that closes the loop." />
      <BetaNote className="mt-6" />

      <section className="section">
        <div className="wrap grid gap-14 md:gap-20">
          <FeatureRow n="01" k="Register · under 5 minutes" title="Add your property." body="Address, type, a cover photo. That's the whole form. The moment it saves, the property is inspection-ready and you're prompted to book the first visit." bullets={["Apartment, villa or independent house", "At least one photo, so the inspector knows the door", "Saved instantly — come back and finish any time"]}><div className="mx-auto max-w-[420px]"><RegisterMock /></div></FeatureRow>
          <FeatureRow n="02" k="Schedule · recurring or one-off" title="Choose how often." body="Weekly, monthly, quarterly — or a single visit before tenants move in. A verified inspector is assigned automatically and the job lands on their calendar." flip bullets={["You're told the moment an inspector is assigned", "Move or cancel free until the day before the visit"]}><div className="mx-auto max-w-[420px]"><ScheduleMock /></div></FeatureRow>
          <FeatureRow n="03" k="Inspect · on-site" title="Every room, every item." body="Pass, Fail or Attention on a structured checklist, with photos and short video attached right there. Three taps per item, and no item can be left blank." bullets={["Drafts auto-save on patchy connections", "Flagged issues need a category, note and a photo", "Once submitted, the report can't be edited"]}><div className="mx-auto max-w-[460px]"><InspectMock /></div></FeatureRow>
          <FeatureRow n="04" k="Report · within the hour" title="Proof in your inbox." body="Every item, status and attachment compiled into one report and sent to you. Always within the hour." flip bullets={["Health score recalculated after every report", "Full inspection history per property"]}><div className="mx-auto max-w-[460px]"><ReportMock /></div></FeatureRow>
          <FeatureRow n="05" k="Decide · your call" title="You say yes. Or no." body="Flagged issues arrive with category, description and evidence. Approve, or decline with a reason. Either way the decision is timestamped forever." bullets={["You see the verified pro's quote + a 15% Still Yours fee — the exact amount, nothing hidden", "Decline closes the issue with your reason on record", "Nothing is dispatched without your approval"]}><div className="mx-auto max-w-[420px]"><DecideMock /></div></FeatureRow>
          <FeatureRow n="06" k="Resolve · verified professionals only" title="Closed, with after-photos." body="Only a verified local professional can be assigned. You get an update at every step, and the completion note and after-photos land in the same record." flip bullets={["The repair happens during a scheduled visit — your inspector stays on-site the whole time", "Requested → Assigned → In progress → Completed, live", "Completion note + after-photos in the same report; rate the provider after"]}><div className="mx-auto max-w-[420px]"><ResolveMock /></div></FeatureRow>
        </div>
      </section>

      <section className="section bg-white">
        <div className="wrap">
          <SectionHead eyebrow="The checklist" title="What the inspector actually checks." lede="A structured, room-by-room checklist so every inspection is comparable with the last one — not a walk-around and a vibe." />
          <div className="mt-10 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {rooms.map(({ I, t, b }, i) => (
              <Reveal key={t} delay={i * 0.04}>
                <div className="card h-full bg-paper p-4 shadow-card sm:p-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-white text-accent shadow-card sm:h-10 sm:w-10"><I size={17} /></span><div className="mt-3 text-[14.5px] font-medium leading-snug sm:mt-4 sm:text-[15.5px]">{t}</div><div className="t-small mt-1 text-[12.5px] leading-snug sm:text-[14px]">{b}</div></div>
              </Reveal>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <div className="card h-full bg-ink p-6 text-white sm:p-8">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><LandPlot size={18} /></span><div className="text-[17px] font-medium">Plots get their own checklist</div></div>
                <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-white/75">Empty land is where things go wrong quietly. The inspector walks the full boundary and photographs every corner with GPS, so you can compare visit to visit.</p>
                <ul className="mt-4 grid gap-1.5 text-[13.5px] text-white/85 sm:grid-cols-2">
                  {["Every boundary corner, GPS-tagged", "Encroachment or occupation", "Fence, gate, signboard condition", "Neighbour construction or dumping", "Notices, road & utility work", "Photo map in the report"].map((t) => <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />{t}</li>)}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="card h-full bg-beige p-6 sm:p-8">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-accent shadow-card"><Car size={18} /></span><div className="text-[17px] font-medium">The car in the basement</div></div>
                <p className="t-small mt-3 max-w-[40ch] text-[14.5px]">Add a car check to any visit for ₹700: started and idled, battery and tyres, fluid leaks, odometer photo, cover on — all in the same report.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WhenWrong />
      <Health />
      <Pocket />
      <Handles />
      <div className="h-16 md:h-24" />
      <CTA title="Book the first inspection today." lede="Register a property in five minutes. The report reaches you within an hour of the visit." />
    </>
  );
}
