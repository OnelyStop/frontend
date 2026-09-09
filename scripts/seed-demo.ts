/** Fills one account with enough graded work that every page has something to render. Re-runnable: it clears its own rows first. */
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "../src/db";
import {
  attemptAnswers,
  attempts,
  bankQuestions,
  doubts,
  notifications,
  papers,
  topics,
  userNotes,
  userTopicStats,
} from "../src/db/schema";

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error("usage: bun scripts/seed-demo.ts <email>");
  process.exit(1);
}

const PAPER = "demo-ibps-po-2025";

// Section, topic, how many attempted, how many of those were right.
const SECTIONS = [
  ["quant", "Percentages", 18, 13],
  ["reasoning", "Seating arrangement", 15, 8],
  ["english", "Error spotting", 20, 17],
  ["ga", "Banking awareness", 12, 6],
  ["computer", "Networking basics", 10, 9],
] as const;

const NOTES = [
  ["quant", "Percentages", "Always clear the bracket before the power."],
  ["reasoning", "Seating arrangement", "Draw the grid before the third clue."],
  [
    "english",
    "Error spotting",
    "'One of the' takes a plural noun, singular verb.",
  ],
] as const;

// doubts.section is the exam_section enum, not the one-word bank section.
const DOUBTS = [
  ["Quantitative Aptitude", "Caselet DI", "How do I split a caselet fast?"],
  ["Reasoning Ability", "Floor puzzles", "When do I branch on a floor puzzle?"],
] as const;

async function userIdFor(email: string): Promise<string> {
  const [row] = await db.execute<{ id: string }>(
    `select id from auth.users where email = '${email.replace(/'/g, "''")}' limit 1`,
  );
  if (!row) throw new Error(`no auth user for ${email} — sign up first`);
  return row.id;
}

async function main() {
  const userId = await userIdFor(EMAIL);
  console.log(`seeding ${EMAIL} (${userId})`);

  // Clear first so a second run does not double every count.
  await db.delete(attempts).where(eq(attempts.userId, userId));
  await db.delete(userNotes).where(eq(userNotes.userId, userId));
  await db.delete(userTopicStats).where(eq(userTopicStats.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(doubts).where(eq(doubts.authorId, userId));
  await db.delete(bankQuestions).where(eq(bankQuestions.paperId, PAPER));
  await db.delete(papers).where(eq(papers.paperId, PAPER));

  await db.insert(papers).values({
    paperId: PAPER,
    examKey: "ibps-po",
    bank: "IBPS",
    role: "PO",
    year: 2025,
    shift: "demo",
  });

  const rows: (typeof bankQuestions.$inferInsert)[] = [];
  for (const [section, topic, attempted] of SECTIONS) {
    for (let i = 0; i < attempted; i++) {
      const qId = `${PAPER}-${section}-${i}`;
      rows.push({
        qId,
        paperId: PAPER,
        qNum: rows.length + 1,
        stem: `${topic} — demo question ${i + 1}`,
        options: { A: "A", B: "B", C: "C", D: "D" },
        answer: "A",
        section,
        topic,
        contentHash: qId,
      });
    }
  }
  await db.insert(bankQuestions).values(rows);

  // Three sittings across the last month, so the 30-day windows have shape.
  for (let sitting = 0; sitting < 3; sitting++) {
    const startedAt = new Date(Date.now() - (sitting + 1) * 6 * 86_400_000);
    const [attempt] = await db
      .insert(attempts)
      .values({
        userId,
        mode: "paper",
        paperId: PAPER,
        startedAt,
        submittedAt: new Date(startedAt.getTime() + 3_600_000),
        score: "42.50",
        servedQIds: rows.map((r) => r.qId),
      })
      .returning({ id: attempts.id });

    let cursor = 0;
    for (const [section, , attempted, correct] of SECTIONS) {
      for (let i = 0; i < attempted; i++) {
        const isCorrect = i < correct;
        await db.insert(attemptAnswers).values({
          attemptId: attempt.id,
          qId: `${PAPER}-${section}-${i}`,
          chosen: isCorrect ? "A" : "B",
          isCorrect,
          timeMs: 30_000 + ((cursor * 1_700) % 40_000),
        });
        cursor++;
      }
    }
  }

  await db.insert(userTopicStats).values(
    SECTIONS.map(([, topic, attempted, correct]) => ({
      userId,
      topic,
      attempted: attempted * 3,
      correct: correct * 3,
    })),
  );

  // Notes hang off a published topic, so they need a real one to point at.
  const published = await db
    .select({ id: topics.id })
    .from(topics)
    .limit(NOTES.length);
  if (published.length) {
    await db.insert(userNotes).values(
      NOTES.map(([, , body], i) => ({
        userId,
        topicId: published[i % published.length].id,
        bodyMarkdown: body,
      })),
    );
  }

  await db.insert(doubts).values(
    DOUBTS.map(([section, topic, title]) => ({
      authorId: userId,
      section,
      topic,
      title,
      body: `${title} Worked examples welcome.`,
    })),
  );

  await db.insert(notifications).values([
    {
      userId,
      kind: "system",
      title: "Your demo data is in",
      body: "Every page now has something to read.",
    },
    {
      userId,
      kind: "marking_ready",
      title: "A descriptive answer came back marked",
      body: "Structure scored well; the conclusion did not.",
    },
  ]);

  console.log(
    `done — 3 sittings, ${rows.length} questions, ${NOTES.length} notes, ${DOUBTS.length} doubts`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
