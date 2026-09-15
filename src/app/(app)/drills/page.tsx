import type { Metadata } from "next";
import { SECTION_FROM_DB, type Subject } from "@/data/navigation";
import { db } from "@/db";
import {
  getTopicMap,
  type TopicMapRow,
} from "@/features/attempts/progress.server";
import { listDrillPool } from "@/features/question-bank/questions.server";
import { currentUserId } from "@/lib/auth.server";
import { DrillsView } from "./drills-view";

export const metadata: Metadata = { title: "Drills" };

// Same as mocks/page.tsx, same reason -- see the comment there.
export const dynamic = "force-dynamic";

// A drill session leads with a handful of weak topics, not the whole tail.
const WEAK_TOPICS_PER_SECTION = 5;

/** Lowest-accuracy topics per section, from the same 30-day topic map
 * /attempt-map reads — signed-out or too-new-to-have-data users just get an
 * empty map, which "Weak topics" mode already treats the same as "Mixed". */
function weakTopicsBySection(
  rows: TopicMapRow[],
): Partial<Record<Subject, string[]>> {
  const bySection = new Map<string, TopicMapRow[]>();
  for (const row of rows) {
    const list = bySection.get(row.section) ?? [];
    list.push(row);
    bySection.set(row.section, list);
  }

  const out: Partial<Record<Subject, string[]>> = {};
  for (const [section, sectionRows] of bySection) {
    const subject = SECTION_FROM_DB[section];
    if (!subject) continue;
    out[subject] = [...sectionRows]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, WEAK_TOPICS_PER_SECTION)
      .map((r) => r.topic);
  }
  return out;
}

export default async function Page() {
  const userId = await currentUserId();
  const [pool, topicMap] = await Promise.all([
    listDrillPool(),
    userId ? getTopicMap(db, userId) : Promise.resolve([]),
  ]);

  return <DrillsView pool={pool} weakTopics={weakTopicsBySection(topicMap)} />;
}
