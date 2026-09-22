import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Smartphone } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Launch offer for the first ten owners.
 *
 * Remove this component — and the hero pill that links to #founding — once ten
 * owners have booked. There is deliberately no "spots left" counter: a counter
 * has to be kept accurate by hand, and a wrong one is worse than none.
 */
const terms = [
  "For the first 10 owners — one free inspection per owner, not per visit",
  "Homes up to 2 BHK, in Bengaluru",
  "The full 42-item check, photos and video of every room, and your report within the hour",
  "Cleaning and repairs aren't included. Any repair you approve is at the professional's actual cost, with no StillYours fee",
  "No card needed. It never turns into a paid plan unless you choose one",
];

export function FoundingOffer() {
  return (
    <div id="founding" className="scroll-mt-24">
      <Reveal>
        <div className="card grid gap-8 bg-ink p-6 text-white sm:p-10 md:grid-cols-[1fr_1.15fr] md:gap-10 md:p-12">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/55">Founding 10 · Bengaluru</p>
            <h3 className="t-2 mt-3 max-w-[14ch]">Your first inspection is free.</h3>
            <p className="mt-4 max-w-[42ch] text-[15.5px] leading-relaxed text-white/75">
              We&apos;re taking our first ten owners at no cost — to learn from you and get the service right before we charge anyone.
            </p>
            <Link href="/access?plan=one-time" className="btn btn-white mt-7">Claim a founding spot <ArrowRight size={16} /></Link>
            <p className="mt-3 text-[13px] text-white/50">The offer closes when ten owners have booked.</p>
          </div>

          <ul className="grid content-start gap-2.5">
            {terms.map((t) => (
              <li key={t} className="flex items-start gap-3 rounded-[12px] bg-white/[0.07] px-4 py-3 text-[14.5px]">
                <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={11} strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </ul>

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <div className="rounded-[14px] bg-white/[0.07] p-5">
              <div className="flex items-center gap-2 text-[15px] font-medium"><MessageCircle size={16} /> What we ask in return</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Honest feedback after the visit — what worked and what didn&apos;t. And your permission to share your report as an
                example, with your name, address and anything personal blurred out. Rather not share it? Just say so — the inspection
                stays free.
              </p>
            </div>
            <div className="rounded-[14px] bg-white/[0.07] p-5">
              <div className="flex items-center gap-2 text-[15px] font-medium"><Smartphone size={16} /> Our app is in beta</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Until it&apos;s ready, your report comes on WhatsApp and as a PDF, you approve repairs by message, and your inspector
                video-calls you at the start and end of the visit.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
