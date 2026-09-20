# Still Yours — marketing site

Multi-page marketing website for **Still Yours**, the smart remote property monitoring and maintenance platform (Project WEB-01).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — hero with animated floor-plan inspection, trust strip, story, how it works, interactive "what happens when something's wrong", comparison, health score, owner stories, trust & safety, CTA |
| `/how-it-works` | All six steps in depth + the room-by-room checklist |
| `/owners` | For NRIs, portfolio investors and vacation-home owners |
| `/network` | For inspectors & service providers — verification flow, their apps, expectations |
| `/platform` | Four roles, admin dashboard, tech stack, roadmap |
| `/access` | Early-access / application form (`?role=owner|inspector|provider`, `?address=`) |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide.

Fonts: Fraunces (display serif) + Schibsted Grotesk (UI) + JetBrains Mono (data labels), loaded with `next/font`.

## Structure

```
src/app                 routes + globals.css (design tokens)
src/components/home     home-page sections
src/components/shared   AddressBar, PageHero, FeatureRow, SectionHead, product Mocks
src/components/site     Nav, Footer, StickyBar
src/components/ui       FloorPlan, HealthRing, EvidenceFrame, Reveal, Logo
```

## Swapping in real photos

`EvidenceFrame` renders a vector "photo" placeholder. Pass `src="/photos/your-file.jpg"` to any instance to use a real image — the annotation box, corner brackets and caption strip render on top of it unchanged.
