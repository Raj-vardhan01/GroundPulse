import type { MetadataRoute } from "next";

/* Installed, this opens straight into the owner app — nobody adds a
   marketing page to their home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StillYours — your properties",
    short_name: "StillYours",
    description: "Your homes, plots and cars in India: reports, visits and every decision, in one place.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcfaf0",
    theme_color: "#fcfaf0",
    lang: "en-IN",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a visit", url: "/app/book" },
      { name: "Reports", url: "/app/reports" },
    ],
  };
}
