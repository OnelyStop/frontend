#!/usr/bin/env node
/**
 * Deterministic validation gate for content/*.topic.json.
 *
 * Runs the automated checks in docs/study-module-spec.md §13: JSON Schema,
 * unique slugs/keys, sorted positions, sourced factual blocks, allowlisted
 * sources, no banned domains, flashcards grounded in real blocks, recomputed
 * quantitative answers, no raw HTML, no fabricated exam-provenance claims.
 *
 * Exit non-zero on any error. Warnings print but pass unless --strict.
 *
 *   node scripts/study-validate.mjs [--dir content/quantitative-aptitude] [--strict]
 *
 * The pure functions are exported for src/features/study/*.test.ts.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- tiny JSON Schema subset ------------------------------------------------
// Handles only what schemas/study-topic.schema.json uses. Not a general
// implementation; a green run here means "matches our schema", nothing wider.

function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`unsupported $ref ${ref}`);
  return ref
    .slice(2)
    .split("/")
    .reduce((node, key) => node[key], root);
}

export function schemaErrors(schema, value, root = schema, path = "") {
  const out = [];
  const at = path || "(root)";

  if (schema.$ref) {
    return schemaErrors(resolveRef(root, schema.$ref), value, root, path);
  }
  if (schema.const !== undefined && value !== schema.const) {
    out.push(`${at}: must equal ${JSON.stringify(schema.const)}`);
    return out;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    out.push(`${at}: must be one of ${schema.enum.join(", ")}`);
    return out;
  }

  const types = schema.type
    ? Array.isArray(schema.type)
      ? schema.type
      : [schema.type]
    : null;
  if (types) {
    const actual =
      value === null
        ? "null"
        : Array.isArray(value)
          ? "array"
          : typeof value === "number" && Number.isInteger(value)
            ? "integer"
            : typeof value;
    const ok = types.some(
      (t) =>
        t === actual ||
        (t === "number" && actual === "integer") ||
        (t === "string" && actual === "string"),
    );
    if (!ok) {
      out.push(`${at}: expected ${types.join("|")}, got ${actual}`);
      return out;
    }
  }
  if (value === null || value === undefined) return out;

  if (typeof value === "string") {
    if (schema.minLength != null && value.length < schema.minLength)
      out.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.maxLength != null && value.length > schema.maxLength)
      out.push(`${at}: longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      out.push(`${at}: does not match /${schema.pattern}/`);
    if (schema.format === "date-time" && Number.isNaN(Date.parse(value)))
      out.push(`${at}: not an ISO date-time`);
    if (schema.format === "uri" && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value))
      out.push(`${at}: not a URI`);
  }

  if (typeof value === "number") {
    if (schema.minimum != null && value < schema.minimum)
      out.push(`${at}: below minimum ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum)
      out.push(`${at}: above maximum ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems)
      out.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems != null && value.length > schema.maxItems)
      out.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.items)
      value.forEach((item, i) =>
        out.push(...schemaErrors(schema.items, item, root, `${at}[${i}]`)),
      );
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) out.push(`${at}: missing required "${key}"`);
    }
    const props = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) out.push(`${at}: unknown property "${key}"`);
      }
    }
    for (const [key, sub] of Object.entries(props)) {
      if (key in value)
        out.push(...schemaErrors(sub, value[key], root, `${at}.${key}`));
    }
  }

  return out;
}

// --- domain gates ---------------------------------------------------------

// Blocks that assert facts and therefore need an allowlisted, non-scope-only
// source. exam_tip / warning / shortcut / summary / practice / objectives are
// author-created guidance (spec §4.5, §16) and do not.
const FACTUAL_BLOCK_TYPES = new Set([
  "introduction",
  "concept",
  "definition",
  "formula",
  "method",
  "worked_example",
  "comparison",
]);

// Raw HTML, script, inline handlers, javascript:/data: URLs, embedded images.
const UNSAFE_MARKDOWN = [
  { re: /<\s*script/i, msg: "contains <script" },
  { re: /<\s*iframe/i, msg: "contains <iframe" },
  { re: /<[a-z][a-z0-9]*(\s[^>]*)?>/i, msg: "contains a raw HTML tag" },
  { re: /<\/[a-z][a-z0-9]*\s*>/i, msg: "contains a raw HTML closing tag" },
  { re: /\son[a-z]+\s*=/i, msg: "contains an inline event handler (on…=)" },
  { re: /javascript:/i, msg: "contains a javascript: URL" },
  { re: /data:[^)\s]*/i, msg: "contains a data: URL" },
  {
    re: /!\[[^\]]*\]\([^)]*\)/,
    msg: "embeds an image (![]) — not allowed yet",
  },
];

function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function domainBanned(host, bannedDomains) {
  return bannedDomains.some((d) => host === d || host.endsWith(`.${d}`));
}

function wordCount(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`|\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const ARITH_OK = /^[0-9.eE+\-*/%() ]*$/;

/** Evaluate a restricted JavaScript arithmetic expression, or throw. */
export function evalArithmetic(expr) {
  const cleaned = expr.replace(/\*\*/g, "^").replace(/\^/g, "**");
  if (!ARITH_OK.test(cleaned.replace(/\*\*/g, ""))) {
    throw new Error(`non-arithmetic expression: ${expr}`);
  }
  // eslint-disable-next-line no-new-func — chars are restricted to arithmetic above
  const value = Function(`"use strict"; return (${cleaned});`)();
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`expression did not evaluate to a finite number: ${expr}`);
  }
  return value;
}

/**
 * Validate one parsed topic object.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateTopic(topic, ctx = {}) {
  const {
    schema,
    registry = {
      sources: [],
      bannedDomains: [],
      fabricatedProvenancePhrases: [],
      prohibitedSourceIds: {},
    },
    corpusTopicSlugs = new Set(),
    strict = false,
  } = ctx;
  const errors = [];
  const warnings = [];
  const push = (list, m) => list.push(m);

  if (schema) errors.push(...schemaErrors(schema, topic));

  const blocks = Array.isArray(topic.blocks) ? topic.blocks : [];
  const cards = Array.isArray(topic.flashcards) ? topic.flashcards : [];
  const declaredSourceIds = new Set(
    (topic.sources ?? []).map((s) => s.sourceId),
  );
  const allowedById = new Map((registry.sources ?? []).map((s) => [s.id, s]));

  // Unique block ids / positions, positions sorted in file order.
  const blockIds = new Set();
  let lastPos = -Infinity;
  for (const [i, b] of blocks.entries()) {
    if (!b || typeof b !== "object") continue;
    if (blockIds.has(b.id))
      push(errors, `blocks[${i}]: duplicate id "${b.id}"`);
    blockIds.add(b.id);
    if (typeof b.position === "number") {
      if (b.position <= lastPos)
        push(
          errors,
          `blocks[${i}] ("${b.id}"): position ${b.position} not strictly after previous ${lastPos}`,
        );
      lastPos = b.position;
    }
  }

  // Unique flashcard ids / positions.
  const cardIds = new Set();
  let lastCardPos = -Infinity;
  for (const [i, c] of cards.entries()) {
    if (!c || typeof c !== "object") continue;
    if (cardIds.has(c.id))
      push(errors, `flashcards[${i}]: duplicate id "${c.id}"`);
    cardIds.add(c.id);
    if (typeof c.position === "number") {
      if (c.position <= lastCardPos)
        push(
          errors,
          `flashcards[${i}] ("${c.id}"): position ${c.position} not strictly after previous ${lastCardPos}`,
        );
      lastCardPos = c.position;
    }
    for (const bid of c.sourceBlockIds ?? []) {
      if (!blockIds.has(bid))
        push(
          errors,
          `flashcards[${i}] ("${c.id}"): sourceBlockId "${bid}" is not a block in this topic`,
        );
    }
  }

  // Sources: allowlisted, declared, not prohibited, not banned domain.
  for (const [i, s] of (topic.sources ?? []).entries()) {
    if (!s || typeof s !== "object") continue;
    if (registry.prohibitedSourceIds?.[s.sourceId])
      push(errors, `sources[${i}]: "${s.sourceId}" is a prohibited source`);
    if (s.usageMode !== "policy" && !allowedById.has(s.sourceId))
      push(
        errors,
        `sources[${i}]: "${s.sourceId}" is not in content/source-registry.json`,
      );
    const allowed = allowedById.get(s.sourceId);
    if (allowed && allowed.usageMode !== s.usageMode)
      push(
        errors,
        `sources[${i}] ("${s.sourceId}"): usageMode "${s.usageMode}" ≠ registry "${allowed.usageMode}"`,
      );
    const host = hostname(s.url);
    if (host && domainBanned(host, registry.bannedDomains ?? []))
      push(errors, `sources[${i}]: banned domain ${host} (${s.url})`);
    if (s.retrievedAt && Number.isNaN(Date.parse(s.retrievedAt)))
      push(errors, `sources[${i}]: retrievedAt is not a date`);
  }

  // Factual blocks need a real, declared, allowlisted source. Markdown safety.
  for (const [i, b] of blocks.entries()) {
    if (!b || typeof b !== "object") continue;
    const md = typeof b.markdown === "string" ? b.markdown : "";
    for (const { re, msg } of UNSAFE_MARKDOWN) {
      if (re.test(md)) push(errors, `blocks[${i}] ("${b.id}"): ${msg}`);
    }
    for (const phrase of registry.fabricatedProvenancePhrases ?? []) {
      if (md.toLowerCase().includes(phrase))
        push(
          errors,
          `blocks[${i}] ("${b.id}"): unsourced exam-provenance claim "${phrase}"`,
        );
    }
    const ids = b.sourceIds ?? [];
    for (const id of ids) {
      if (!declaredSourceIds.has(id))
        push(
          errors,
          `blocks[${i}] ("${b.id}"): sourceId "${id}" is not in the file's sources[]`,
        );
    }
    if (FACTUAL_BLOCK_TYPES.has(b.type)) {
      const usable = ids.filter(
        (id) =>
          allowedById.has(id) && allowedById.get(id).usageMode !== "scope_only",
      );
      if (usable.length === 0)
        push(
          errors,
          `blocks[${i}] ("${b.id}", ${b.type}): factual block has no usable allowlisted source`,
        );
    }

    // Quantitative worked examples must recompute.
    if (
      topic.subjectSlug === "quantitative-aptitude" &&
      b.type === "worked_example"
    ) {
      const answers = Array.isArray(b.expectedAnswers) ? b.expectedAnswers : [];
      if (answers.length === 0)
        push(
          errors,
          `blocks[${i}] ("${b.id}"): quantitative worked_example has no expectedAnswers to recompute`,
        );
      for (const [j, a] of answers.entries()) {
        if (!a.expression) {
          push(
            errors,
            `blocks[${i}] ("${b.id}").expectedAnswers[${j}] ("${a.label}"): no expression — cannot recompute`,
          );
          continue;
        }
        try {
          const got = evalArithmetic(a.expression);
          const tol = a.tolerance ?? Math.max(1e-6, Math.abs(a.value) * 1e-6);
          if (Math.abs(got - a.value) > tol)
            push(
              errors,
              `blocks[${i}] ("${b.id}").expectedAnswers[${j}] ("${a.label}"): declared ${a.value}, expression gives ${got}`,
            );
        } catch (e) {
          push(
            errors,
            `blocks[${i}] ("${b.id}").expectedAnswers[${j}]: ${e.message}`,
          );
        }
      }
    }
  }

  // Flashcard text safety + provenance.
  for (const [i, c] of cards.entries()) {
    if (!c || typeof c !== "object") continue;
    const text = `${c.front ?? ""}\n${c.back ?? ""}\n${c.explanation ?? ""}`;
    for (const phrase of registry.fabricatedProvenancePhrases ?? []) {
      if (text.toLowerCase().includes(phrase))
        push(
          errors,
          `flashcards[${i}] ("${c.id}"): unsourced exam-provenance claim "${phrase}"`,
        );
    }
    for (const { re, msg } of UNSAFE_MARKDOWN) {
      if (re.test(text)) push(errors, `flashcards[${i}] ("${c.id}"): ${msg}`);
    }
  }

  // Word budget.
  const words = blocks.reduce(
    (n, b) => n + wordCount(typeof b.markdown === "string" ? b.markdown : ""),
    0,
  );
  if (words < 550)
    push(errors, `word count ${words} is far below the 600 floor`);
  else if (words < 600 || words > 1400)
    push(warnings, `word count ${words} is outside the 600–1400 target`);
  if (words > 1600)
    push(errors, `word count ${words} is far above the 1400 ceiling`);

  // Freshness for time-sensitive subjects.
  const timeSensitive =
    topic.subjectSlug === "banking-awareness" || topic.examCycle != null;
  if (timeSensitive) {
    if (!topic.lastReviewedAt) {
      push(
        topic.contentStatus === "published" ? errors : warnings,
        `time-sensitive topic has no lastReviewedAt`,
      );
    } else {
      const ageDays =
        (Date.now() - Date.parse(topic.lastReviewedAt)) / 86_400_000;
      if (ageDays > (topic.reviewCadenceDays ?? 365))
        push(
          topic.contentStatus === "published" ? errors : warnings,
          `last reviewed ${Math.round(ageDays)}d ago, past the ${topic.reviewCadenceDays}d cadence`,
        );
    }
    if (topic.examCycle && !topic.officialNotificationUrl)
      push(errors, `exam-cycle topic has no officialNotificationUrl`);
  }

  // Prerequisites that name a slug nothing in the corpus provides.
  for (const slug of topic.prerequisiteTopicSlugs ?? []) {
    if (corpusTopicSlugs.size && !corpusTopicSlugs.has(slug))
      push(warnings, `prerequisite "${slug}" is not an authored topic yet`);
  }

  return {
    errors,
    warnings: strict ? [] : warnings,
    strictErrors: strict ? warnings : [],
  };
}

// --- runner --------------------------------------------------------------

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".topic.json")) out.push(full);
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const dirArg = args.indexOf("--dir");
  const scanDir = join(ROOT, dirArg >= 0 ? args[dirArg + 1] : "content");

  let registry;
  try {
    registry = JSON.parse(
      readFileSync(join(ROOT, "content/source-registry.json"), "utf8"),
    );
  } catch (e) {
    console.error(`cannot read content/source-registry.json: ${e.message}`);
    process.exit(1);
  }
  const schema = JSON.parse(
    readFileSync(join(ROOT, "schemas/study-topic.schema.json"), "utf8"),
  );

  const files = walk(scanDir);
  if (files.length === 0) {
    console.error(`no *.topic.json under ${relative(ROOT, scanDir)}`);
    process.exit(1);
  }

  // First pass: gather every topic slug and (subject/chapter/topic) path.
  const parsed = [];
  const pathSeen = new Map();
  const slugSeen = new Map();
  let hardFail = 0;
  for (const file of files) {
    const rel = relative(ROOT, file);
    let topic;
    try {
      topic = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      console.error(`✗ ${rel}\n    invalid JSON: ${e.message}`);
      hardFail++;
      continue;
    }
    parsed.push({ rel, topic });
    const path = `${topic.subjectSlug}/${topic.chapterSlug}/${topic.topicSlug}`;
    if (pathSeen.has(path))
      (console.error(
        `✗ ${rel}\n    duplicate path ${path} (also ${pathSeen.get(path)})`,
      ),
        hardFail++);
    else pathSeen.set(path, rel);
    if (slugSeen.has(topic.topicSlug))
      (console.error(
        `✗ ${rel}\n    duplicate topicSlug "${topic.topicSlug}" (also ${slugSeen.get(topic.topicSlug)})`,
      ),
        hardFail++);
    else slugSeen.set(topic.topicSlug, rel);
  }
  const corpusTopicSlugs = new Set(slugSeen.keys());

  let totalErrors = hardFail;
  let totalWarnings = 0;
  for (const { rel, topic } of parsed) {
    const { errors, warnings, strictErrors } = validateTopic(topic, {
      schema,
      registry,
      corpusTopicSlugs,
      strict,
    });
    const allErrors = [...errors, ...strictErrors];
    if (allErrors.length === 0 && warnings.length === 0) {
      console.log(`✓ ${rel}`);
    } else {
      console.log(
        `${allErrors.length ? "✗" : "•"} ${rel}  (${topic.title ?? "?"})`,
      );
      for (const e of allErrors) console.log(`    ERROR  ${e}`);
      for (const w of warnings) console.log(`    warn   ${w}`);
    }
    totalErrors += allErrors.length;
    totalWarnings += warnings.length;
  }

  console.log(
    `\n${parsed.length} topic(s), ${totalErrors} error(s), ${totalWarnings} warning(s)`,
  );
  process.exit(totalErrors > 0 ? 1 : 0);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) main();
