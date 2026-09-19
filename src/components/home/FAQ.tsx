"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/motion";

const faqs = [
  { q: "What does an inspection include?", a: "A verified inspector walks a structured room-by-room checklist — entrance, living, kitchen, bedrooms, bathrooms, balcony, electrical and utilities — marking each item Pass, Fail or Attention, with photos or short video attached to every item." },
  { q: "How quickly do I get the report?", a: "Within an hour of the visit, guaranteed. In practice the report compiles the moment the checklist is submitted and usually reaches your email and dashboard in minutes." },
  { q: "How do I know I can trust the inspector?", a: "Nobody walks in off the street. Every inspector is referred or scouted, then vetted in person: Aadhaar and address proof, a police-verification certificate, two references we actually call, and a supervised trial inspection. You get their name, photo and verified badge before the visit; the checklist only opens with the OTP you share at the door; every photo is GPS- and time-stamped; and owners rate every visit — drop below the bar and they leave the network." },
  { q: "Can a repair happen without my approval?", a: "No. A flagged issue is a question, not a work order. You approve or decline with a reason, and only then is a verified provider assigned. Every decision is written to an audit log nobody can edit." },
  { q: "Where are my photos and videos stored?", a: "In private cloud storage, served to you on signed, expiring links. Only verified, assigned users on your property can see them." },
  { q: "What does it cost?", a: "For homes up to 2 BHK: a one-time visit is ₹1,999, Care is ₹7,999 a year (4 inspections + 2 full house cleanings) and Care+ is ₹14,999 a year (adds 2 maintenance services with repairs covered up to ₹25,000). For 3 BHK it's ₹2,499 / ₹9,999 / ₹19,999 and for 4 BHK+ it's ₹2,999 / ₹11,999 / ₹24,999. Add-ons on any plan: cleaning ₹1,500, car ₹700, plot visit ₹1,999." },
  { q: "What exactly does the Care+ cover include?", a: "Up to ₹25,000 of repairs a year, at most ₹12,500 per incident. Labour by the verified provider is always on us. For parts, we pay the first ₹5,000 of every incident — if parts come to ₹7,000, we pay ₹5,000 and you pay ₹2,000 at cost, only after you approve the quote. Appliance replacement, structural/civil work, pre-existing issues and cosmetic upgrades aren't covered — we still inspect and quote them, they just sit outside the ₹25,000." },
  { q: "How do you make money on repairs?", a: "Openly. When you approve a repair, you see the verified provider's quote and a flat 10% GroundPulse fee on top — for example ₹3,000 + ₹300 = ₹3,300 — and you approve that exact amount. The provider gets their quote, we keep the 10%. No brokerage, no hidden commission, no marked-up bills. Repairs inside your Care+ cover carry no fee at all." },
  { q: "Who is there when the cleaning or repair happens?", a: "Your inspector. Cleaning crews and repair providers only work during a scheduled visit, with the verified inspector on-site the whole time — from the moment they enter to the after-photos. Nobody gets your keys alone, and nothing happens behind your back." },
  { q: "How do I know the inspector actually checked every room?", a: "Because they can't skip one. When you sign up you list your rooms — bedrooms, bathrooms, kitchen, balconies, parking — and each becomes a mandatory video + photo slot in the inspector's app, plus a final exit walkthrough of the whole home. Every slot is GPS- and time-stamped, and the visit can't be submitted until all of them are filled." },
  { q: "Can I watch the visit myself?", a: "Yes. Tick \"Call me live\" at sign-up and the inspector video-calls you at the start and the end of every visit — you, your parents or your caretaker can watch live from anywhere. Every room is on recorded video anyway, and the visit is protected up to ₹1,00,000." },
  { q: "What if something is stolen or damaged during a visit?", a: "It's built so that can't happen quietly: one verified person, in with your OTP, every room on video, GPS and time on every photo, and an exit walkthrough before they leave. Watch the exit video in your report; if anything looks off, tap \"Something wrong?\" — any time until your next visit. With that evidence, the GroundPulse Guarantee covers theft or damage during a visit up to ₹1,00,000 — a very, very rare case with a system this tight, but if it ever happens, we pay, not you. Keep cash, jewellery and documents locked away — inspectors never open cupboards or lockers." },
  { q: "Does the inspector leave after an hour?", a: "No. The inspector stays for the entire visit, however long it takes to cover every room and item. We pay inspectors for the extra time — you never do." },
  { q: "Why not just ask a neighbour or relative to check?", a: "For a quick glance, do — a good neighbour is worth a lot. But a favour gets you an opinion, not a checklist. Someone doing you a kindness won't open the meter box, run the geyser for ten minutes or feel under the bathroom sink, and you'd feel rude asking. They also won't give you bad news straight; an inspector is paid to write down exactly what's there and is rated by you afterwards on whether they did. The bigger difference is over time: every visit runs the same checklist in the same order, so 'damp patch 4 cm in March, 11 cm in July' becomes a fact you can act on. A one-off favour can never build that comparison. And if you want your neighbour at the door, bring them — they can share the OTP, walk the visit and get the same report you do." },
  { q: "Is this like a local property agent?", a: "No. Local agents usually inspect only if they get to broker your tenant — they take a commission and the actual checking rarely happens. GroundPulse doesn't do brokerage or take commissions. Inspection, proof and owner-approved repairs are the whole product." },
  { q: "Do you inspect plots and land?", a: "Yes. A plot visit is ₹1,999: a full boundary walk with a GPS-tagged photo of every corner, checking for encroachment, occupation, unauthorised construction, dumping and notices — report within the hour with a photo map. Book it once, or every quarter." },
  { q: "Can you check my car too?", a: "Yes — ₹700 per car, added to any visit or plan. The inspector starts it, lets it idle, checks the battery, tyres and leaks, photographs the odometer and the cover, and it all goes into the same report." },
  { q: "Which cities are live?", a: "Bengaluru is live now — homes, plots and cars across the city. We open a new city only when its verified inspector and provider bench is ready. Next: Pune, Hyderabad and Jaipur." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="wrap" aria-labelledby="faq-title">
      <Reveal>
        <div className="panel bg-paper px-5 pb-10 pt-10 sm:px-10 md:px-16 md:pb-16 md:pt-16">
          <div className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-14">
            <h2 id="faq-title" className="t-1 max-w-[10ch]">Frequently asked questions</h2>
            <ul className="divide-y divide-line border-t border-line">
              {faqs.map((f, i) => {
                const on = open === i;
                return (
                  <li key={f.q}>
                    <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                      <span className="text-[18px] font-medium tracking-[-0.01em] sm:text-[20px]">{f.q}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-beige text-ink">{on ? <Minus size={15} /> : <Plus size={15} />}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                          <p className="t-body max-w-[62ch] pb-6 text-text-2">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
