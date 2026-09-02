#!/usr/bin/env node
/**
 * Marks reviewed topics as published: sets contentStatus to "published" and
 * every flashcard's status to "approved" in the *.topic.json files, so the
 * next `study:import` serves them to learners rather than only in preview.
 *
 *   node scripts/study-publish.mjs                     # whole corpus
 *   node scripts/study-publish.mjs --dir content/english
 *   node scripts/study-publish.mjs --unpublish         # revert to draft
 *
 * This is the human-review gate from the spec: a person runs it once content
 * has been approved. It edits the Git-managed source, then re-run the importer.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".topic.json")) out.push(full);
  }
  return out;
}

const args = process.argv.slice(2);
const unpublish = args.includes("--unpublish");
const dirArg = args.indexOf("--dir");
const scanDir = join(ROOT, dirArg >= 0 ? args[dirArg + 1] : "content");

const topicStatus = unpublish ? "draft" : "published";
const cardStatus = unpublish ? "draft" : "approved";

let changed = 0;
for (const file of walk(scanDir)) {
  const topic = JSON.parse(readFileSync(file, "utf8"));
  topic.contentStatus = topicStatus;
  for (const card of topic.flashcards ?? []) card.status = cardStatus;
  writeFileSync(file, JSON.stringify(topic, null, 2) + "\n");
  changed++;
  console.log(
    `${unpublish ? "↩" : "✓"} ${relative(ROOT, file)}  ->  ${topicStatus}`,
  );
}

console.log(
  `\n${changed} topic file(s) set to contentStatus=${topicStatus}, flashcards=${cardStatus}.` +
    `\nRun: bun run study:import`,
);
