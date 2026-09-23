import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms — in plain English",
  description:
    "What we do on a visit, what we never touch, what happens to your video, what we pay for if we damage something, and the terms of the free launch offer.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms — in plain English | StillYours", description: "What we do on a visit, what we never touch, what happens to your video, and what we pay for if we damage something.", url: "/terms" },
};

/**
 * Deliberately written the way we would say it out loud. If a line here ever
 * stops being true, it comes off the page the same day — an owner reading this
 * is deciding whether to hand a stranger their keys.
 */
const sections: { h: string; p?: string; items?: string[] }[] = [
  {
    h: "Who we are",
    p: `${site.name} is a property-inspection service in ${site.city}, started by two founders. We visit a home, a plot or a car that you own but cannot get to, check it, and send you the evidence. We are not a broker, we do not find tenants, and we take no commission on rent.`,
  },
  {
    h: "Who does your visit right now",
    p: "One of the two of us. We are doing our first inspections ourselves rather than handing them to anyone else, so we learn the job properly first. When we do start taking on inspectors, every one of them is referred, met in person, and checked — Aadhaar, address proof, police verification and two references we actually call. A new inspector's first two visits are done with one of us standing next to them.",
  },
  {
    h: "What happens on a visit",
    items: [
      "We come on a day you pick, and we tell you who is coming — name and photo — before we arrive.",
      "Nobody goes in until you, or whoever you nominate, confirms it on WhatsApp.",
      "We walk a 42-item checklist and mark each item pass, needs attention, or fail, with photos.",
      "Every room you listed is filmed, and we film a walkthrough of the whole property before leaving.",
      "We video-call you at the start and at the end if you want to watch it live.",
      "Your report reaches you within an hour of us leaving.",
    ],
  },
  {
    h: "What we never touch",
    items: [
      "We do not open cupboards, wardrobes, lockers, safes, drawers or any locked storage. Ever.",
      "We do not move or handle your belongings beyond what a check needs — running a tap, flipping a switch, opening a window latch.",
      "We do not keep your keys overnight. They go back to your caretaker, your society office or whoever you nominate on the same day.",
      "We do not let anyone else into the property. If you want your caretaker, a neighbour or a relative present, tell us and we will wait for them.",
      "Please keep cash, jewellery and documents locked away before the visit. We would rather never be near them.",
    ],
  },
  {
    h: "If we damage something",
    p: "If we break something while we are inside — a tap, a tile, a fitting, a pipe — we repair or replace it at our cost. No argument about whose fault it was. What we do not cover is anything already broken before we arrived, ordinary wear and tear, or damage from weather, tenants, neighbours or anyone else who has access to the property. The visit recording is there precisely so neither of us has to guess.",
  },
  {
    h: "Video and photos",
    items: [
      "The whole visit is recorded on a body camera, at no extra cost, and you get the full video on a private link.",
      "Recordings and photos are yours. They are not shown to anyone else and never sold.",
      "Recordings are deleted after 90 days unless you ask us to keep them.",
      "Footage is uploaded after every visit and wiped from the camera. The inspector keeps no copy.",
      "If we ever want to use anything from your visit as a public example, we ask you first — and your name, address and anything personal are blurred out.",
    ],
  },
  {
    h: "Repairs and cleaning",
    items: [
      "Nothing is repaired, cleaned or bought without your yes on the exact amount first.",
      "A flagged issue is a question, not an invoice.",
      "Repairs and cleaning are done by rated professionals from established home-service companies, with your inspector present.",
      "Outside the free launch offer, a repair is the professional's quote plus a flat 10%, shown to you in full before you approve. We take no brokerage and no hidden commission.",
    ],
  },
  {
    h: "The free launch offer",
    items: [
      "One free inspection for each of the first 10 owners — per owner, not per visit.",
      "Homes up to 2 BHK, in Bengaluru.",
      "It includes the full 42-item check, photos and video of every room, the body-camera recording, and your report within the hour.",
      "Cleaning and repairs are not included. Any repair you approve is at the professional's actual cost, with no StillYours fee on top.",
      "No card, no deposit. It does not turn into a paid plan unless you choose one.",
      "What we ask in return: honest feedback, permission to share your report as a blurred example, and permission to use what we learn on these visits to train the inspectors we take on later. You can say no to the sharing and the inspection is still free.",
      "The offer closes once ten owners have booked.",
    ],
  },
  {
    h: "Our app is in beta",
    p: "The owner and inspector apps are still being built. Until they are ready, your report comes on WhatsApp and as a PDF, you approve repairs by message, and we video-call you at the start and end of the visit. Anything on this site that describes the app describes where it is going, not where it is today — and we will say so plainly rather than let you assume otherwise.",
  },
  {
    h: "Cancelling",
    p: "Cancel a visit any time before we set out and it costs you nothing. On a yearly plan, cancel within the first 30 days and 75% comes back — a flat 25% is retained. After that you can pause whenever you like.",
  },
  {
    h: "If something goes wrong",
    p: `Tell us. Message ${site.contactEmail} or reply on WhatsApp, any time up to your next visit. We would much rather hear it from you than have you quietly stop using us.`,
  },
];

/**
 * Inspector-facing terms. Kept on the same page on purpose — an owner reading
 * what we ask of an inspector is a reason to trust us, not a secret.
 */
const inspectorTerms = [
  "The body camera is StillYours property, handed to you against a signed receipt with its serial number and a photo of its condition.",
  "You wear it on every visit, from the moment you enter until you leave. Footage is uploaded after each visit and wiped from the device. You keep no copy.",
  "If the camera is lost or damaged, its replacement cost of ₹9,000 is deducted from your fees.",
  "₹500 is held back from each of your first three payouts — ₹1,500 in total. It is your money and it is returned in full when you stop working with us and hand the camera back in working order.",
  "Your first two visits are done with one of the founders beside you.",
  "You never open cupboards, wardrobes, lockers or any locked storage, you never accept cash at a property, and you never keep an owner's keys overnight.",
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title={<>The terms, written the way<br className="hidden md:block" /> we would say them</>}
        lede="No clause hunting. This is what we do on a visit, what we never touch, what happens to your video, and what we pay for if we get something wrong."
      >
        <Reveal delay={0.1} className="mt-8 flex justify-center">
          <Link href="/access?plan=one-time" className="btn btn-accent">Book an inspection <ArrowRight size={16} /></Link>
        </Reveal>
      </PageHero>

      <section className="section">
        <div className="wrap">
          <div className="mx-auto grid max-w-[760px] gap-3">
            {sections.map(({ h, p, items }) => (
              <Reveal key={h}>
                <div className="card bg-white p-6 shadow-card sm:p-8">
                  <h2 className="t-3 text-[19px] font-medium tracking-[-0.02em]">{h}</h2>
                  {p && <p className="t-body mt-3 text-[15px] leading-relaxed text-text-2">{p}</p>}
                  {items && (
                    <ul className="mt-3 grid gap-2.5">
                      {items.map((t) => (
                        <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-text-2">
                          <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}

            <Reveal>
              <div className="card bg-ink p-6 text-white sm:p-8">
                <h2 className="t-3 text-[19px] font-medium tracking-[-0.02em]">What we ask of an inspector</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                  These are the terms every inspector signs before their first visit. They are here in the open because the person
                  walking into your home should be held to something you can read.
                </p>
                <ul className="mt-4 grid gap-2.5">
                  {inspectorTerms.map((t) => (
                    <li key={t} className="flex gap-3 rounded-[12px] bg-white/[0.07] px-4 py-3 text-[14.5px] leading-relaxed text-white/85">
                      <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-white/40" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/access?role=inspector" className="btn btn-white mt-6">Apply to be an inspector <ArrowRight size={16} /></Link>
              </div>
            </Reveal>

            <p className="t-small mt-2 px-1 text-[13px]">
              Last updated 23 September 2026. If any of this changes, the page changes with it — and if a change affects a visit you
              have already booked, we tell you before the visit. Questions: <a className="underline hover:text-ink" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
