import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { listSubjects, listTopicPaths } from "@/features/study/queries.server";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// Only pages that are public, indexable and worth a crawl budget.
const STATIC_PAGES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/study", changeFrequency: "weekly", priority: 0.9 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.8 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // A failed read must not take the whole sitemap down with it.
  const [subjects, topics] = await Promise.all([
    listSubjects().catch(() => []),
    listTopicPaths().catch(() => []),
  ]);

  return [
    ...STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...subjects.map((subject) => ({
      url: `${SITE_URL}/study/${subject.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...topics.map(({ subjectSlug, chapterSlug, topicSlug }) => ({
      url: `${SITE_URL}/study/${subjectSlug}/${chapterSlug}/${topicSlug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
