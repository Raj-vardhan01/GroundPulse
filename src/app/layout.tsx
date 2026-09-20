import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, organizationLd, websiteLd } from "@/lib/seo";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], weight: "variable", axes: ["opsz"] });
const serif = DM_Serif_Display({ variable: "--font-serif", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: "StillYours — Far away. Still yours.", template: "%s · StillYours" },
  description:
    "Verified inspectors for your home, your plot and even the car in the basement. Photo-and-video reports within the hour, and repairs that never happen without your approval.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  applicationName: "StillYours",
  category: "Property inspection and maintenance",
  keywords: [
    "property inspection Bengaluru",
    "NRI property management India",
    "home inspection service for NRIs",
    "vacant house check service",
    "plot inspection encroachment check",
    "house deep cleaning Bengaluru",
    "remote property monitoring India",
    "property caretaker service Bengaluru",
  ],
  authors: [{ name: "StillYours", url: SITE_URL }],
  creator: "StillYours",
  publisher: "StillYours",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title: "StillYours — Far away. Still yours.",
    description: "Verified inspections for homes, plots and cars — reports within the hour, owner-approved repairs.",
    type: "website",
    siteName: "StillYours",
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: "StillYours — Far away. Still yours.", description: "Verified inspections for homes, plots and cars — reports within the hour, owner-approved repairs." },
};

export const viewport: Viewport = { themeColor: "#fcfaf0", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${serif.variable} ${mono.variable} ${hand.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={[organizationLd, websiteLd]} />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
