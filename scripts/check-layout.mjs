#!/usr/bin/env node
/**
 * Reject files that sit outside the folder that owns them. This repo has
 * already had an invented `src/infrastructure/` duplicating `src/lib/`.
 *
 * Checked against what a commit would contain — tracked plus untracked
 * non-ignored — so a new file in the wrong place fails before it lands.
 */

import { execFileSync } from "node:child_process";

const ROOT_ALLOWED = new Set([
  ".claude",
  ".env.example",
  ".github",
  ".husky",
  ".gitignore",
  ".prettierignore",
  ".prettierrc.json",
  "AGENTS.md",
  "CLAUDE.md",
  "DESIGN.md",
  "LICENSE",
  "README.md",
  "STANDARDS.md",
  "bun.lock",
  // Git-managed authoring source for the study module, and its JSON Schemas.
  // Content lives here, not in the bundle; the importer projects it into Postgres.
  "content",
  "schemas",
  // Local-dev Postgres so migrations and the content importer have a real
  // database without a network round trip. Production uses the managed one.
  "docker",
  "docker-compose.yml",
  "docs",
  "drizzle.config.ts",
  "eslint.config.mjs",
  "next.config.ts",
  "package.json",
  "postcss.config.mjs",
  "scripts",
  "src",
  "tsconfig.json",
  "vercel.json",
  "vitest.config.mts",
]);

/**
 * Each src/ subtree, and the extensions it may hold. The split that matters is
 * React versus not: a .tsx under lib/ or db/ means a component has been dropped
 * into a layer that is supposed to be callable from anywhere.
 */
const SRC_DIRS = {
  app: [".ts", ".tsx", ".css", ".svg", ".ico"],
  components: [".ts", ".tsx", ".css"],
  "design-system": [".ts", ".tsx", ".css"],
  features: [".ts", ".tsx", ".css"],
  context: [".ts", ".tsx"],
  config: [".ts"],
  data: [".ts"],
  db: [".ts"],
  lib: [".ts"],
  styles: [".css"],
  migrations: [".sql", ".json", ".md"],
};

const SRC_FILES = new Set(["proxy.ts"]);

function committedFiles() {
  const run = (args) =>
    execFileSync("git", ["ls-files", "-z", ...args], { encoding: "buffer" })
      .toString("utf8")
      .split("\0")
      .filter(Boolean);
  return [
    ...new Set([
      ...run(["--cached"]),
      ...run(["--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function violation(path) {
  const parts = path.split("/");
  const [top] = parts;

  if (!ROOT_ALLOWED.has(top)) {
    return `unknown top-level entry — add it to ROOT_ALLOWED if it belongs`;
  }
  if (top !== "src") return null;

  if (parts.length === 2) {
    return SRC_FILES.has(parts[1])
      ? null
      : `src/ holds folders, not loose files (allowed: ${[...SRC_FILES].join(", ")})`;
  }

  const dir = parts[1];
  const allowed = SRC_DIRS[dir];
  if (!allowed) {
    return `src/${dir}/ is not a known layer — reuse one of: ${Object.keys(SRC_DIRS).join(", ")}`;
  }

  const ext = path.slice(path.lastIndexOf("."));
  if (!allowed.includes(ext)) {
    return `src/${dir}/ holds ${allowed.join(", ")} — not ${ext}`;
  }
  return null;
}

const failures = [];
let checked = 0;
for (const path of committedFiles()) {
  checked += 1;
  const why = violation(path);
  if (why) failures.push(`${path}: ${why}`);
}

// Scanning nothing is a broken path, not a clean bill of health.
if (checked === 0) {
  console.error("::error::no files found — git ls-files returned nothing");
  process.exit(1);
}

if (failures.length) {
  console.error(`${failures.length} file(s) in the wrong place:\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`  OK — ${checked} files, every one in the folder that owns it`);
