import type { Metadata } from "next";
import { AccessForm } from "./AccessForm";

export const metadata: Metadata = {
  title: "Join the Waitlist — Home Inspections in Bengaluru",
  description:
    "Tell us where your property is and how to reach you. We come back on WhatsApp within a day. The first ten inspections in Bengaluru are free.",
  alternates: { canonical: "/access" },
  openGraph: { title: "Join the Waitlist | StillYours", description: "Tell us where your property is and how to reach you. We come back on WhatsApp within a day. The first ten inspections in Bengaluru are free.", url: "/access" },
};

/* The role comes from the server, not useSearchParams — reading it on the
   client would push this whole page out of the server-rendered HTML, and a
   page Google sees as empty is no use to us. */
export default async function Page({ searchParams }: PageProps<"/access">) {
  const sp = await searchParams;
  const role = sp.role === "inspector" ? "inspector" : "owner";
  return <AccessForm initialRole={role} />;
}
