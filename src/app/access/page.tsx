import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessForm } from "./AccessForm";

export const metadata: Metadata = { title: "Get started" };

export default function Page() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}
