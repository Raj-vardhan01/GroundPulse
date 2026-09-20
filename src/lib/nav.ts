/* The top bar had seven flat links and no hierarchy, so nothing read as
   "here is what you can buy" versus "here is how the company works".
   Two groups fix that: what we do for you, and who is behind it. */
export type NavItem = { href: string; label: string; note?: string };
export type NavEntry = NavItem & { items?: NavItem[] };

export const navLinks: NavEntry[] = [
  {
    href: "/owners",
    label: "Services",
    items: [
      { href: "/owners", label: "Home inspections", note: "Room-by-room checklist, photos & video, report in an hour" },
      { href: "/cleaning", label: "Cleaning", note: "Refresh or deep clean, inspector on site, before/after photos" },
      { href: "/plots", label: "Plots & land", note: "Boundary walk, GPS photos, encroachment check" },
    ],
  },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  {
    href: "/network",
    label: "Company",
    items: [
      { href: "/network", label: "Our inspectors", note: "How every inspector is vetted, and how to apply" },
      { href: "/platform", label: "Platform", note: "The app, the audit log and where your media lives" },
      { href: "/sample-report", label: "Sample report", note: "See exactly what lands in your inbox" },
    ],
  },
];

/** Flat list — the footer wants every destination, not the grouping. */
export const footerLinks: NavItem[] = navLinks.flatMap((l) => (l.items ? l.items : [l]));
