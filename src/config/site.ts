// A constant, not an env lookup: the old VERCEL_PROJECT_PRODUCTION_URL branch baked localhost into every canonical.
export const SITE_URL =
  process.env.SITE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.onelystop.in");

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
  "IBPS RRB",
  "bank exam mock test",
  "sectional cutoff",
  "descriptive paper marking",
];
