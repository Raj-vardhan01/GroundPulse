import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    /* The signed-in apps are behind a sign-in and carry nothing a search
       engine should hold — and a crawler following /field into a job
       board would index other people's addresses. */
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/field", "/ops", "/welcome", "/signin", "/offline"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
