import type { Metadata } from "next";
import { SampleReport } from "./SampleReport";

export const metadata: Metadata = { title: "Sample report" };

export default function Page() {
  return <SampleReport />;
}
