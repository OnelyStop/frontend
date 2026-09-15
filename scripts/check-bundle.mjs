#!/usr/bin/env node
/** A NEXT_PUBLIC_ var that is set but absent from the built chunks never reached the browser — which is how Sentry shipped for months with no DSN and swallowed every error. */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const STATIC_DIR = ".next/static";

const INLINED = [
  { name: "NEXT_PUBLIC_SENTRY_DSN", carries: "browser error reports" },
  { name: "NEXT_PUBLIC_POSTHOG_KEY", carries: "every product event" },
  { name: "NEXT_PUBLIC_GA_MEASUREMENT_ID", carries: "page view counts" },
];

function jsFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...jsFiles(path));
    else if (entry.name.endsWith(".js")) found.push(path);
  }
  return found;
}

let files;
try {
  files = jsFiles(STATIC_DIR);
} catch {
  console.error(`::error::${STATIC_DIR} is missing — run bun run build first`);
  process.exit(1);
}

// Scanning nothing reports clean, which is the failure this whole script exists to catch.
if (files.length === 0) {
  console.error(`::error::no chunks under ${STATIC_DIR} — nothing was checked`);
  process.exit(1);
}

const bundle = files.map((f) => readFileSync(f, "utf8")).join("\n");

let failed = 0;
for (const { name, carries } of INLINED) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.log(`  skip  ${name} is unset — nothing to inline`);
    continue;
  }
  if (bundle.includes(value)) {
    console.log(`  ok    ${name} reached the bundle`);
    continue;
  }
  console.error(
    `::error::${name} is set but appears in none of the ${files.length} chunks — ${carries} is silently off`,
  );
  failed = 1;
}

process.exit(failed);
