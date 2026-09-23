import type { Metadata } from "next";
import { SampleReport } from "./SampleReport";

export const metadata: Metadata = {
  title: "Sample Home Inspection Report",
  description:
    "See what you receive after every visit: every room on video, each checklist item marked Pass, Fail or Attention, and a quote for anything broken.",
  alternates: { canonical: "/sample-report" },
  openGraph: { title: "Sample Home Inspection Report | StillYours", description: "See what you receive after every visit: every room on video, each checklist item marked Pass, Fail or Attention, and a quote for anything broken.", url: "/sample-report" },
};

export default function Page() {
  return <SampleReport />;
}
