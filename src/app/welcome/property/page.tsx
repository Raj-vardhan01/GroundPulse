import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Steps } from "@/components/app/Steps";
import { PropertyForm } from "@/components/app/PropertyForm";
import { mapConfig } from "@/lib/ola";
import { requireOwner } from "@/lib/auth";

export default async function Page() {
  await requireOwner({ allowOnboarding: true });
  return (
    <>
      <Link href="/welcome" className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> About you</Link>
      <Steps at={2} />
      <h1 className="serif mt-8 text-[clamp(2rem,4vw,2.7rem)] leading-[1.05] tracking-[-0.035em]">
        Tell us about the place.
      </h1>
      <p className="t-lede mt-3 max-w-[52ch] text-text-2">
        This is what an inspector reads before they leave home. The rooms you list here become the checklist they walk, item by item.
      </p>
      <div className="mt-8"><PropertyForm welcome map={mapConfig()} /></div>
    </>
  );
}
