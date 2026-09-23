import type { MetadataRoute } from "next";
import { APPS_LIVE } from "@/lib/flags";

/* Installed, this opens straight into the owner app — nobody adds a
   marketing page to their home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StillYours — your properties",
    short_name: "StillYours",
    description: "Your homes, plots and cars in India: reports, visits and every decision, in one place.",
    id: "/app",
    /* While the apps are hidden an installed shortcut has to land
       somewhere real, not on the 404 its start_url would hit. */
    start_url: APPS_LIVE ? "/app" : "/",
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
    ...(APPS_LIVE
      ? { shortcuts: [{ name: "Book a visit", url: "/app/book" }, { name: "Reports", url: "/app/reports" }] }
      : {}),
  };
}
