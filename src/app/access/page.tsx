import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessForm } from "./AccessForm";

export const metadata: Metadata = {
  title: "Get started",
  description:
    "Tell us where the property is and what it needs. Bengaluru is live for homes, plots and cars — a verified inspector, a fixed day, and a photo-and-video report within the hour of the visit.",
  alternates: { canonical: "/access" },
  openGraph: { title: "Get started · StillYours", description: "Tell us where the property is and what it needs. Bengaluru is live for homes, plots and cars — a verified inspector, a fixed day, and a photo-and-video report within the hour of the visit.", url: "/access" },
};

export default function Page() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}
