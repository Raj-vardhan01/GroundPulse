import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";
import { Mark } from "@/components/ui/Logo";

export const metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div>
        <Mark size={44} className="mx-auto" />
        <span className="mt-8 grid h-14 w-14 place-items-center rounded-full bg-beige text-text-2 mx-auto"><CloudOff size={22} /></span>
        <h1 className="serif mt-5 text-[28px] tracking-[-0.03em]">No connection right now.</h1>
        <p className="t-small mx-auto mt-2 max-w-[38ch]">Your reports are safe on our side. As soon as you are back online this page will load exactly as it was.</p>
        <Link href="/app" className="btn btn-accent mt-7"><RefreshCw size={15} /> Try again</Link>
      </div>
    </main>
  );
}
