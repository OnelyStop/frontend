// Vercel provides the production hostname; SITE_URL overrides it for any other host.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL =
  process.env.SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const SUPPORT_EMAIL = "hello@onelystop.in";

export const SITE_NAME = "onelystop";
export const SITE_TAGLINE = "clear every sectional cutoff";

export const SITE_DESCRIPTION =
  "Mocks, drills, current affairs and descriptive marking for IBPS, SBI and RBI. Built around negative marking, sectional timing and what to skip.";

// The exams the product is actually built for; used in metadata and JSON-LD.
export const EXAM_KEYWORDS = [
  "IBPS PO",
  "IBPS Clerk",
  "SBI PO",
  "SBI Clerk",
  "RBI Grade B",
  "bank exam mock test",
  "sectional cutoff",
  "descriptive paper marking",
];
