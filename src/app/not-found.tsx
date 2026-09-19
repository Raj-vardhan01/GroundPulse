import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="wrap pt-[120px] pb-24 text-center md:pt-[160px]">
      <p className="t-label">404</p>
      <h1 className="serif t-display mt-3">This room isn't on the plan.</h1>
      <p className="t-lede mx-auto mt-4 max-w-[44ch] text-text-2">The page you're looking for doesn't exist — but your home, plot and car are still covered.</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-accent">Back to home <ArrowRight size={16} /></Link>
        <Link href="/pricing" className="btn btn-white">See pricing</Link>
      </div>
    </section>
  );
}
