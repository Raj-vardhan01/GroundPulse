/* Edit these — they show up in the footer and the founders section. */
export const site = {
  name: "GroundPulse",
  city: "Bengaluru",
  email: "hello@groundpulse.app",
  company: "GroundPulse Technologies Pvt. Ltd. (registration in progress)",
  address: "HSR Layout, Bengaluru 560102",
  founders: [
    {
      name: "Naitik Agrawal",
      role: "Co-founder · Product & growth",
      initials: "NA",
      place: "Bengaluru · family flat in Jaipur",
      sign: "Naitik",
      /* short version, used where there isn't room for the full story */
      line: "Grew up watching his parents fly home every few months 'just to check'.",
      quote: "He didn't have to sell it to me. My parents' flat had been empty for four years.",
      story: [
        "Raj brought me this idea on a call that was meant to be about something else entirely. He'd been circling the same thing for weeks — millions of people own a place they can't get to, and the only thing standing between them and an expensive surprise is a neighbour saying sab theek hai.",
        "He didn't have to sell it to me. My parents' flat had been sitting empty for four years. Every few months one of us would fly down, walk through it, find something small that had quietly turned into something expensive, and fly back. We called it 'just going to check'. It cost a ticket and a weekend every time — and we still only knew the truth about that house on the one day we happened to be standing inside it.",
        "So I wasn't hearing a startup idea. I was hearing the fix for something my family had been paying for, in money and in worry, for years. That's the part I hold on to when we build: the proof has to be real. Not a summary, not a thumbs-up — the actual video of the actual room, stamped with a time, that you can open at 11 PM from another country and finally stop wondering.",
      ],
    },
    {
      name: "Raj Vardhan",
      role: "Co-founder · Engineering",
      initials: "RV",
      place: "Bengaluru",
      sign: "Raj",
      line: "Builds the inspector app, the OTP-to-video chain and the audit log — the parts that make the promise real.",
      /* ── Raj: drop your pull-quote here and your paragraphs in `story` below.
         Leave them empty and the card renders its short version instead. ── */
      quote: "",
      story: [] as string[],
    },
  ],
  inspectors: [
    { name: "Ravi K.", initials: "RK", area: "Whitefield · Marathahalli", visits: 212, rating: 4.9, since: "2024", bg: "Ex-facility supervisor, 11 yrs" },
    { name: "Meena S.", initials: "MS", area: "Koramangala · HSR", visits: 148, rating: 5.0, since: "2025", bg: "Ex-bank operations, 8 yrs" },
    { name: "Arun P.", initials: "AP", area: "Yelahanka · Devanahalli", visits: 96, rating: 4.8, since: "2025", bg: "Ex-Army JCO, plots & land" },
  ],
};
