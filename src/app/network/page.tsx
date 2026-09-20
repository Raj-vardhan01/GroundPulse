import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, Fingerprint, Handshake, KeyRound, MapPinned, Search, ShieldCheck as ShieldIcon, Star, UserCheck } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { FeatureRow } from "@/components/shared/FeatureRow";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { InspectMock, InspectorJobsMock, ProviderJobsMock } from "@/components/shared/Mocks";

export const metadata: Metadata = {
  title: "Our inspectors",
  description:
    "Every StillYours inspector is referred or scouted, then vetted in person — Aadhaar, address proof, police verification, two references we call, and a supervised trial visit. Invite-only, never off the street.",
  alternates: { canonical: "/network" },
  openGraph: { title: "Our inspectors · StillYours", description: "Every StillYours inspector is referred or scouted, then vetted in person — Aadhaar, address proof, police verification, two references we call, and a supervised trial visit. Invite-only, never off the street.", url: "/network" },
};

const steps = [
  { I: Search, t: "Scouted or referred", b: "We don't run open applications. Inspectors come to us through people we already trust — or we go looking for them." },
  { I: UserCheck, t: "Vetted in person", b: "Aadhaar, address proof, police verification, two references and a supervised trial inspection. Most conversations end here." },
  { I: BadgeCheck, t: "Verified before the first visit", b: "Only then does the verified flag turn on — and only verified people can ever be assigned to your home." },
  { I: Star, t: "Rated after every job", b: "Owners rate every visit. Fall below the bar and you quietly leave the network." },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Our inspectors" title={<>Hand-picked. Verified.<br className="hidden md:block" /> Invite-only.</>} lede="We don't take applications off the street. Every Still Yours inspector and service provider is referred or scouted, vetted in person, and verified before their first visit — the kind of person we'd hand our own keys to.">
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/access?role=inspector" className="btn btn-accent">Request an invitation <ArrowRight size={16} /></Link>
          <Link href="/access?role=provider" className="btn btn-white">Refer someone you trust <ArrowRight size={16} /></Link>
        </Reveal>
      </PageHero>

      <section className="section">
        <div className="wrap">
          <SectionHead title="How someone makes it into the network" lede="Owners are letting our people into their homes while they're thousands of kilometres away. So the network stays small on purpose — and the bar stays high." />
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ I, t, b }, i) => (
              <Reveal key={t} delay={i * 0.05}>
                <li className="card h-full bg-white p-6 shadow-card"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><I size={18} /></span><span className="text-[13px] font-medium text-text-2">0{i + 1}</span></div><div className="mt-4 text-[16px] font-medium">{t}</div><p className="t-small mt-1.5 text-[14px]">{b}</p></li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section pt-0 md:pt-0">
        <div className="wrap">
          <Reveal>
            <div className="card grid gap-8 bg-ink p-6 text-white sm:p-10 md:grid-cols-[1fr_1.3fr] md:items-center md:p-14">
              <div>
                <p className="text-[18px] font-medium text-white/70">Before anyone gets your keys</p>
                <h3 className="t-1 mt-1 max-w-[14ch]">Seven checks. Every person. No exceptions.</h3>
                <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-white/75">Most people we talk to don't make it through. The ones who do are the ones we'd send to our own parents' house.</p>
              </div>
              <ol className="grid gap-2 sm:grid-cols-2">
                {[
                  [Fingerprint, "Aadhaar & address proof verified"],
                  [ShieldIcon, "Police-verification certificate"],
                  [UserCheck, "Two references, actually called"],
                  [ClipboardCheck, "Supervised trial inspection"],
                  [KeyRound, "Every visit starts with the owner's OTP"],
                  [MapPinned, "GPS + time-stamp on every photo"],
                  [Star, "Rated by the owner after every job"],
                ].map(([I, t], i) => {
                  const Icon = I as typeof Star;
                  return <li key={t as string} className="flex items-center gap-3 rounded-[12px] bg-white/[0.07] px-4 py-3 text-[14.5px]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10"><Icon size={15} /></span><span><span className="mr-2 text-white/40">0{i + 1}</span>{t as string}</span></li>;
                })}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-white">
        <div className="wrap grid gap-14 md:gap-20">
          <FeatureRow k="Inspectors" title="Your day, already planned." body="Assigned inspections grouped by date with the address and status. Open today's job, walk the rooms — or the plot boundary with GPS photos — attach the proof, flag what needs flagging, submit." bullets={["Save as draft and resume — drafts survive bad signal", "Every item needs a status; every flagged issue needs a photo", "Elapsed timer and one-tap Flag Issue on the checklist"]}><div className="grid gap-3 sm:grid-cols-2"><InspectorJobsMock /><InspectMock /></div></FeatureRow>
          <FeatureRow k="Service providers" title="Only jobs the owner already approved." body="No quoting into the void. A job reaches a verified provider after the owner has approved the repair and an admin has matched it by service type and locality. Accept, do the work, mark it complete." flip bullets={["Accept or decline each assignment", "A confirmation note is required to mark complete", "After-photos close the loop for the owner"]}><div className="mx-auto max-w-[440px]"><ProviderJobsMock /></div></FeatureRow>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="panel bg-beige p-6 sm:p-10 md:p-14">
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div><p className="t-label">The standard</p><h3 className="t-2 mt-3">Careful, honest, on time.</h3><p className="t-body mt-4 max-w-[44ch] text-text-2">The whole platform runs on trust that owners can't verify in person. So we hold every inspector and provider to a simple standard — and we'd rather have fewer people than lower it.</p></div>
                <ul className="grid gap-2">
                  {["Arrive in the scheduled window", "Photograph what you report — every time", "Never take work outside the platform", "Note anything you're unsure about as Attention", "Treat the home like the owner is standing next to you"].map((t) => <li key={t} className="card flex items-center gap-3 bg-white px-4 py-3 text-[15px]"><ClipboardCheck size={16} className="shrink-0 text-accent" />{t}</li>)}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section pt-0 md:pt-0">
        <div className="wrap">
          <Reveal>
            <div className="panel on-dark bg-ink px-5 py-14 text-center sm:px-8 md:py-20">
              <span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Handshake size={22} /></span>
              <h2 className="serif t-display mx-auto max-w-[16ch] text-balance text-white">Think you're someone we'd trust with a stranger's keys?</h2>
              <p className="t-lede mx-auto mt-5 max-w-[46ch] text-white/75">Tell us who you are and who can vouch for you. We reach out only when there's a fit — and we keep the network small on purpose.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/access?role=inspector" className="btn btn-accent">Request an invitation <ArrowRight size={16} /></Link>
                <Link href="/access?role=provider" className="btn btn-white">Refer a provider <ArrowRight size={16} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
