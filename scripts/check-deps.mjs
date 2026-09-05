#!/usr/bin/env node
/**
 * Fails on a high or critical advisory in the dependency tree; reports the
 * rest.
 *
 * The threshold is deliberate. The tree carries a moderate dev-only advisory
 * today, and a gate that is red the day it lands gets bypassed rather than
 * fixed — after which it catches nothing. High and above is what should stop a
 * merge; the rest is printed so it is still seen.
 */

import { execFileSync } from "node:child_process";

const BLOCKING = new Set(["high", "critical"]);

let raw;
try {
  raw = execFileSync("bun", ["audit", "--json"], { encoding: "utf8" });
} catch (error) {
  // bun exits non-zero whenever it finds anything, so output still matters.
  raw = error.stdout?.toString() ?? "";
  if (!raw.trim()) {
    console.error(
      "::error::bun audit produced no output — the check ran nothing",
    );
    process.exit(1);
  }
}

const advisories = Object.entries(JSON.parse(raw || "{}")).flatMap(
  ([pkg, list]) => list.map((a) => ({ pkg, ...a })),
);

if (advisories.length === 0) {
  console.log("  OK — no advisories");
  process.exit(0);
}

const blocking = advisories.filter((a) => BLOCKING.has(a.severity));

for (const a of advisories) {
  const mark = BLOCKING.has(a.severity) ? "BLOCK" : "note ";
  console.log(`  ${mark} ${a.severity.padEnd(8)} ${a.pkg}  ${a.title}`);
  console.log(`        ${a.url}`);
}

if (blocking.length) {
  console.error(
    `::error::${blocking.length} high or critical advisory — run bun update, or raise it as an issue if there is no fix`,
  );
  process.exit(1);
}

console.log(`  OK — ${advisories.length} advisory below the high threshold`);
