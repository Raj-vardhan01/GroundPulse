import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessForm } from "./AccessForm";

export const metadata: Metadata = {
  title: "Book a Home Inspection in Bengaluru",
  description:
    "Tell us where your property is and what it needs. A verified inspector visits on your chosen day and sends the report within an hour.",
  alternates: { canonical: "/access" },
  openGraph: { title: "Book a Home Inspection in Bengaluru | StillYours", description: "Tell us where your property is and what it needs. A verified inspector visits on your chosen day and sends the report within an hour.", url: "/access" },
};

export default function Page() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}
