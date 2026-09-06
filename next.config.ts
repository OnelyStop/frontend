import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
};

// Source maps upload only when SENTRY_AUTH_TOKEN, org and project are all set,
// so a local or CI build without them is unaffected.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Strips Sentry's own console noise from the client bundle.
  disableLogger: true,
});
