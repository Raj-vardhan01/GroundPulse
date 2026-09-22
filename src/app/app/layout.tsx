import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { unread, visits, openIssues, invoices } from "@/lib/queries";
import { AppShell } from "@/components/app/AppShell";
import { InstallHint } from "@/components/app/InstallHint";

export const metadata: Metadata = {
  title: { default: "Your properties", template: "%s · StillYours" },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireOwner();
  const [events, vs, issues, invs] = await Promise.all([
    unread(user.id), visits(user.id), openIssues(user.id), invoices(user.id),
  ]);

  return (
    <AppShell
      user={{ name: user.name, phone: user.phone }}
      unread={events}
      counts={{
        visits: vs.filter((v) => ["scheduled", "assigned", "en_route", "on_site", "submitted"].includes(v.status)).length,
        reports: issues.length,
        due: invs.filter((i) => i.status === "due").length,
      }}
    >
      {children}
      <InstallHint />
    </AppShell>
  );
}
