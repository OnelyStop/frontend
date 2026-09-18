import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { PLAN_LIMITS } from "@/features/billing/limits";
import { allowedDays, dayBack, todayIst } from "@/features/current-affairs/day";
import { listSubjects, listTopicPaths } from "@/features/study/queries.server";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_PAGES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/study", changeFrequency: "weekly", priority: 0.9 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.8 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

/** Only the days a signed-out reader can actually open: listing a day behind the delay sends a crawler to an empty page. */
function currentAffairsDays(): string[] {
  const { currentAffairsDays: span, currentAffairsDelayDays: delay } =
    PLAN_LIMITS.free;
  if (span === null) return [];
  const { newest } = allowedDays(todayIst(), span, delay ?? 0);
  return Array.from({ length: span }, (_, i) => dayBack(newest, i));
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A failed read must not take the whole sitemap down with it.
  const [subjects, topics] = await Promise.all([
    listSubjects().catch(() => []),
    listTopicPaths().catch(() => []),
  ]);

  return [
    ...STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    })),
    ...subjects.map((subject) => ({
      url: `${SITE_URL}/study/${subject.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...topics.map(({ subjectSlug, chapterSlug, topicSlug }) => ({
      url: `${SITE_URL}/study/${subjectSlug}/${chapterSlug}/${topicSlug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${SITE_URL}/current-affairs`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...currentAffairsDays().map((day) => ({
      url: `${SITE_URL}/current-affairs?day=${day}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
