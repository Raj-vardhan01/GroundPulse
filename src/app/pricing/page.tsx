import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { Pricing } from "@/components/home/Pricing";
import { CoverTerms } from "@/components/home/CoverTerms";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";

export const metadata: Metadata = { title: "Pricing" };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Pricing" title={<>One visit, or a year<br className="hidden md:block" /> of peace of mind.</>} lede="Homes from ₹1,999 and plots from ₹1,999 — one visit, or a year of quarterly eyes on it. Cars ₹700 on any visit." />
      <Pricing full />
      <CoverTerms />
      <div className="h-6 md:h-10" />
      <FAQ />
      <CTA title="Book your first visit" lede="Register a property and pick a plan in under five minutes. Cancel a yearly plan within 30 days and 75% is refunded." />
    </>
  );
}
