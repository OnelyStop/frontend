import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

const PUBLIC_PATHS = ["/", "/signup", "/login", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
  }));
}
