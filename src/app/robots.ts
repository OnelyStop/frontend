import type { MetadataRoute } from "next";
import { PROTECTED_PREFIXES } from "@/config/routes";
import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", ...PROTECTED_PREFIXES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
