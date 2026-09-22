import { requireOwner } from "@/lib/auth";
import { properties } from "@/lib/queries";
import { BookingForm } from "@/components/app/BookingForm";
import { PageHead } from "@/components/app/ui";
import { Steps } from "@/components/app/Steps";

export const metadata = { title: "Book a visit" };

export default async function Page({ searchParams }: PageProps<"/app/book">) {
  const user = await requireOwner();
  const sp = await searchParams;
  const mine = await properties(user.id);
  const welcome = sp.welcome === "1";

  return (
    <>
      {welcome && <div className="pb-6"><Steps at={3} /></div>}
      <PageHead
        eyebrow={welcome ? "Last step" : "New visit"}
        title={welcome ? "Book the first visit." : "Book a visit"}
        lede="Pick the day, and we find a verified inspector for it. The report is with you within the hour of them leaving."
      />
      <BookingForm
        user={user}
        properties={mine}
        initialProperty={typeof sp.property === "string" ? sp.property : undefined}
        welcome={welcome}
      />
    </>
  );
}
