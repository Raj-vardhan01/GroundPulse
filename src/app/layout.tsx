import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], weight: "variable", axes: ["opsz"] });
const serif = DM_Serif_Display({ variable: "--font-serif", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: "GroundPulse — Know your home is fine. From anywhere.", template: "%s · GroundPulse" },
  description:
    "Verified inspectors for your home, your plot and even the car in the basement. Photo-and-video reports within the hour, and repairs that never happen without your approval.",
  metadataBase: new URL("https://groundpulse.app"),
  openGraph: { title: "GroundPulse", description: "Verified inspections for homes, plots and cars — reports within the hour, owner-approved repairs.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#fbf9f9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} ${hand.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
