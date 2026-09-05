// Absolute origin for metadata, robots.txt and the sitemap. Vercel provides
// the production hostname; SITE_URL overrides it for any other host.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL =
  process.env.SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const SUPPORT_EMAIL = "hello@onelystop.in";
