/** Fills one account with enough graded work that every page has something to render. Re-runnable: it clears its own rows first. */
import { config } from "dotenv";
import { eq, like } from "drizzle-orm";

config({ path: ".env.local" });

import { db } from "../src/db";
import {
  articles,
  currentAffairsQuestions,
  attemptAnswers,
  attempts,
  bankQuestions,
  doubts,
  flashcards,
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

// Section (a SECTION_DB value, or every query drops it), topic, attempted, correct.
const SECTIONS = [
  ["Quantitative", "Percentages", 18, 13],
  ["Reasoning", "Seating arrangement", 15, 8],
  ["English", "Error spotting", 20, 17],
  ["GA", "Banking awareness", 12, 6],
  ["Computer", "Networking basics", 10, 9],
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

// `dev` is the id AUTH_DISABLED runs as, so a local run can see the same pages.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

async function userIdFor(email: string): Promise<string> {
  if (email === "dev") {
    await db.execute(
      `insert into auth.users (id, email) values ('${DEV_USER_ID}', 'dev@onelystop.local') on conflict (id) do nothing`,
    );
    return DEV_USER_ID;
  }
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
  // Answers go first: the FK points at bank_questions, and a stale q_num loses the new rows.
  await db.execute(
    `delete from public.attempt_answers where q_id like '${PAPER}-%'`,
  );
  await db.delete(bankQuestions).where(eq(bankQuestions.paperId, PAPER));

  await db
    .insert(papers)
    .values({
      paperId: PAPER,
      examKey: "ibps-po",
      bank: "IBPS",
      role: "PO",
      // listMockPapers filters on these three; without them the paper never lists.
      examType: "Prelims",
      durationMin: 60,
      year: 2025,
      shift: "demo",
    })
    .onConflictDoUpdate({
      target: papers.paperId,
      set: {
        examType: "Prelims",
        durationMin: 60,
        isActive: true,
        isCanonical: true,
      },
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
  await db.insert(bankQuestions).values(rows).onConflictDoNothing();

  // Two modes: mocks read as full papers, drills as short pulls from the bank.
  const MODES = ["paper", "paper", "paper", "bank", "bank"] as const;
  for (let sitting = 0; sitting < MODES.length; sitting++) {
    const startedAt = new Date(Date.now() - (sitting + 1) * 6 * 86_400_000);
    const [attempt] = await db
      .insert(attempts)
      .values({
        userId,
        mode: MODES[sitting],
        paperId: MODES[sitting] === "paper" ? PAPER : null,
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

  // Current affairs and flashcards read from their own tables, not from attempts.
  await db.delete(articles).where(eq(articles.source, "rbi_rss"));
  await db.insert(articles).values(
    [
      ["RBI holds the repo rate at 6.50%", "national"],
      ["SEBI tightens disclosure for AIF managers", "national"],
      ["IMF revises India growth to 6.8%", "international"],
      ["New UPI limit for tax payments", "national"],
    ].map(([title, scope], i) => ({
      source: "rbi_rss" as const,
      title,
      summary: `${title} — what the exam asks from it.`,
      url: `https://example.invalid/demo-${i}`,
      publishedAt: new Date(Date.now() - i * 86_400_000),
      scope: scope as "national" | "international",
      contentHash: `demo-article-${i}`,
      status: "used" as const,
    })),
  );

  await db
    .delete(currentAffairsQuestions)
    .where(like(currentAffairsQuestions.explanation, "Demo card%"));
  await db.insert(currentAffairsQuestions).values(
    Array.from({ length: 8 }, (_, i) => ({
      extractedDay: new Date(Date.now() - i * 86_400_000)
        .toISOString()
        .slice(0, 10),
      questionText: `Which body set the policy change reported on day ${i + 1}?`,
      options: { A: "RBI", B: "SEBI", C: "IRDAI", D: "NABARD" },
      answer: "A",
      explanation: `Demo card ${i + 1} — the exam asks the body, not the number.`,
      topic: "Banking awareness",
    })),
  );

  const [topicForCards] = await db
    .select({ id: topics.id })
    .from(topics)
    .limit(1);
  if (topicForCards) {
    await db.delete(flashcards).where(eq(flashcards.topicId, topicForCards.id));
    const CARDS: [string, string][] = [
      ["Divisibility by 8", "Last three digits divide by 8."],
      ["Unit digit of 7^83", "Cycle length 4; 83 mod 4 = 3, so 3."],
      ["Factors of 360", "2^3·3^2·5 → (3+1)(2+1)(1+1) = 24."],
    ];
    // draft is the default and never renders; these have to be approved to show.
    await db.insert(flashcards).values(
      CARDS.map(([front, back], i) => ({
        topicId: topicForCards.id,
        contentVersion: 1,
        stableKey: `demo-card-${i}`,
        position: i,
        front,
        back,
        difficulty: "easy",
        status: "approved" as const,
      })),
    );
  }

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
    `done — ${MODES.length} sittings, ${rows.length} questions, ${NOTES.length} notes, ${DOUBTS.length} doubts, 4 articles`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
