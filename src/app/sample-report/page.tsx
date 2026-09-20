import type { Metadata } from "next";
import { SampleReport } from "./SampleReport";

export const metadata: Metadata = {
  title: "Sample report",
  description:
    "See the actual report that lands in your inbox within the hour — every room on video, all 42 items with a Pass, Fail or Attention verdict, and every flagged issue with a quote you approve or decline.",
  alternates: { canonical: "/sample-report" },
  openGraph: { title: "Sample report · StillYours", description: "See the actual report that lands in your inbox within the hour — every room on video, all 42 items with a Pass, Fail or Attention verdict, and every flagged issue with a quote you approve or decline.", url: "/sample-report" },
};

export default function Page() {
  return <SampleReport />;
}
