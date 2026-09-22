import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { propertyViews } from "@/lib/queries";
import { PropertyCard } from "@/components/app/PropertyCard";
import { Empty, PageHead, Panel } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = { title: "Properties" };

export default async function Page() {
  const user = await requireOwner();
  const views = await propertyViews(user.id);

  return (
    <>
      <PageHead
        eyebrow="Everything you own"
        title="Properties"
        lede="Each one keeps its own history: every visit, every report, every decision you made and when."
        action={<Link href="/app/properties/new" className="btn btn-accent btn-sm"><Plus size={15} /> Add property</Link>}
      />
      {views.length === 0 ? (
        <Panel>
          <Empty icon={Home} title="No properties yet." body="Add the first one — the address, the rooms, and how an inspector gets in. It takes about two minutes."
            cta={<Link href="/app/properties/new" className="btn btn-accent"><Plus size={16} /> Add a property</Link>} />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {views.map((v, i) => <Reveal key={v.property.id} delay={0.04 * i}><PropertyCard v={v} /></Reveal>)}
        </div>
      )}
    </>
  );
}
