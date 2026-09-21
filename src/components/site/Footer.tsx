import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { footerLinks } from "@/lib/nav";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-white">
      <div className="wrap grid grid-cols-1 gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-16">
        <div>
          <Logo />
          <p className="t-body mt-4 max-w-[34ch] text-[15px]">See the true condition of your home, your plot — even your car — from anywhere in the world, without ever stepping through the door.</p>
        </div>
        <div>
          <div className="t-label mb-3">Product</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            {footerLinks.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-ink">{l.label}</Link></li>)}
            <li><Link href="/access" className="hover:text-ink">Early access</Link></li>
            <li><Link href="/platform" className="hover:text-ink">For investors & engineers</Link></li>
          </ul>
        </div>
        <div>
          <div className="t-label mb-3">What we promise</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            <li>Homes, plots &amp; land — and the car in the basement</li>
            <li>Reports within the hour</li>
            <li>100% verified inspectors & providers</li>
            <li>No repair without your approval</li>
            <li>Immutable audit trail</li>
          </ul>
        </div>
        <div>
          <div className="t-label mb-3">Contact</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            <li>{site.email}</li>
            <li>Bengaluru (live) · Pune, Hyderabad, Jaipur next</li>
            <li>{site.address}</li>
          </ul>
        </div>
      </div>
      <div className="wrap flex flex-col gap-2 border-t border-line py-5 text-[12.5px] text-text-3 sm:flex-row sm:justify-between">
        <span>© 2026 Still Yours. Your property media is stored securely and only visible to verified, assigned users.</span>
        <span>Made in India, for owners everywhere.</span>
      </div>
    </footer>
  );
}
