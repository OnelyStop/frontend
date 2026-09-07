import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

/* No Content-Security-Policy here yet: Razorpay Checkout injects its own script
   and frames, and a policy written without testing against a live checkout
   breaks payments rather than protecting them. frame-ancestors is the one
   directive safe to state alone. */
const SECURITY_HEADERS = [
  // Two years and preload-eligible; Vercel already redirects to HTTPS, this stops the first plaintext hop.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
};

// Maps upload only with SENTRY_AUTH_TOKEN, org and project all set; disableLogger's replacement is webpack-only and this build is Turbopack.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});
