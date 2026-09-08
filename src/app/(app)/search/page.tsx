import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Empty, PageHeader } from "@/design-system";
import { searchPublic } from "@/features/study/queries.server";

// Google's own guidance: keep internal search results out of the index.
export const metadata: Metadata = {
  title: "Search the knowledge base",
  description:
    "Find a subject or a topic across the bank-exam knowledge base — quantitative aptitude, reasoning, English, banking and computer awareness.",
  robots: { index: false, follow: true },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.slice(0, 100);
  const hits = query ? await searchPublic(query) : [];

  return (
    <div>
      <PageHeader
        title="Search"
        sub="Subjects and topics across the knowledge base."
      />

      <form action="/search" method="get" role="search" className="mb-8">
        <div className="border-line rounded-ctl focus-within:border-brand flex h-11 items-center gap-2.5 border px-3.5 transition-colors">
          <Search
            size={16}
            strokeWidth={1.75}
            className="text-ink-3 shrink-0"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="Percentages, syllogisms, NPA…"
            aria-label="Search the knowledge base"
            className="placeholder:text-ink-4 h-full w-full bg-transparent text-[15px] outline-none"
          />
        </div>
      </form>

      {!query ? (
        <p className="text-ink-3 text-[14px]">
          Type a subject or a topic name to begin.
        </p>
      ) : hits.length === 0 ? (
        <Empty
          title={`Nothing matches “${query}”`}
          sub="Try a shorter phrase, or browse the knowledge base by subject."
        />
      ) : (
        <>
          <p className="text-ink-3 mb-4 text-[13px]">
            {hits.length} result{hits.length === 1 ? "" : "s"} for “{query}”
          </p>
          <ul className="border-line border-t">
            {hits.map((hit) => (
              <li key={hit.href} className="border-line border-b">
                <Link
                  href={hit.href}
                  className="hover:bg-brand-soft/40 block px-2 py-3.5 transition-colors"
                >
                  <span className="text-ink-3 text-[12px]">{hit.context}</span>
                  <span className="mt-0.5 block text-[15.5px] tracking-[-0.01em]">
                    {hit.title}
                  </span>
                  {hit.summary ? (
                    <span className="text-ink-2 mt-1 block max-w-[76ch] text-[13.5px] leading-relaxed">
                      {hit.summary}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
