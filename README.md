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

## Lead capture

Both forms on `/access` POST to `/api/leads`, which writes to Postgres and
optionally emails you. Before this existed, both forms called `setDone(true)`
and threw the submission away.

### Setup

1. Create a Postgres database (Neon, Supabase and Vercel Postgres all work).
2. Run the schema once:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_leads.sql
   ```
3. Set `DATABASE_URL` in Vercel → Settings → Environment Variables, for all
   environments. Copy `.env.example` to `.env.local` for local work.
4. Optional, to be emailed on every submission: set `LEADS_EMAIL_TO` and
   `LEADS_EMAIL_FROM`, then **either** `RESEND_API_KEY` **or** SMTP
   (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Resend takes priority
   if both are present. Gmail works as the SMTP option with an App Password —
   see `.env.example`. With neither configured, leads still save; you just are
   not notified.

### Reading the leads

```sql
select created_at, name, email, phone, address, service, estimate_inr
from owner_leads order by created_at desc;

select created_at, name, phone, city, localities, experience
from inspector_applications order by created_at desc;
```

### If the database is down

The route returns 503 and the form shows the real failure with an email
fallback — it never reports success it did not achieve. The full payload is
written to the Vercel logs so any lead lost to an outage can be recovered.
