import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { requireOwner } from "@/lib/auth";
import { doSignOut } from "@/lib/actions";

export const metadata = { title: "Welcome", robots: { index: false } };

export default async function WelcomeLayout({ children }: LayoutProps<"/welcome">) {
  await requireOwner({ allowOnboarding: true });
  return (
    <div className="app-scope min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-4">
          <Link href="/"><Logo size={34} /></Link>
          <form action={doSignOut}><button className="text-[13px] font-medium text-text-2 transition hover:text-ink">Sign out</button></form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8">{children}</main>
    </div>
  );
}
