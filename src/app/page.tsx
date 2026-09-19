import { Hero } from "@/components/home/Hero";
import { Relax } from "@/components/shared/Relax";
import { Owners } from "@/components/home/Owners";
import { Steps } from "@/components/home/Steps";
import { WhenWrong } from "@/components/home/WhenWrong";
import { ComingHome } from "@/components/home/ComingHome";
import { PlotsHome } from "@/components/home/PlotsHome";
import { Handles } from "@/components/home/Handles";
import { Pricing } from "@/components/home/Pricing";
import { Pocket } from "@/components/home/Pocket";
import { NetworkTeaser } from "@/components/home/NetworkTeaser";
import { Inspectors } from "@/components/home/Inspectors";
import { Guarantee } from "@/components/home/Guarantee";
import { Founders } from "@/components/home/Founders";
import { Health } from "@/components/home/Health";
import { Story } from "@/components/home/Story";
import { Neighbour } from "@/components/home/Neighbour";
import { Timeline } from "@/components/home/Timeline";
import { Trust } from "@/components/home/Trust";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";
import { StickyBar } from "@/components/site/StickyBar";

export default function Home() {
  return (
    <>
      <Hero />
      <Relax />
      <Owners />
      <Steps />
      <Timeline />
      <WhenWrong />
      <ComingHome />
      <PlotsHome />
      <Pricing />
      <Handles />
      <Health />
      <Pocket />
      {/* warm tinted band */}
      <div className="sheet bg-beige pb-16 md:pb-24">
        <Story />
        <Neighbour />
        <Trust />
      </div>

      {/* FAQ panel pulls up over the band */}
      <div className="relative z-[1] -mt-10 md:-mt-14">
        <FAQ />
      </div>
      <NetworkTeaser />
      <Inspectors />
      <Guarantee />
      <Founders />
      <CTA />
      <StickyBar />
    </>
  );
}
