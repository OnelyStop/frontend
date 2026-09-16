import { articleScope, articleSource } from "@/db/schema";

export type OptionKey = "A" | "B" | "C" | "D";

// Derived, not restated: three copies of this union drifted the moment a feed was added.
export type ArticleSource = (typeof articleSource.enumValues)[number];
export type ArticleScope = (typeof articleScope.enumValues)[number];

export type RawArticle = {
  source: ArticleSource;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  scope: ArticleScope;
};

export type DraftQuestion = {
  questionText: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};

export type GeneratedQuestion =
  { relevant: false } | ({ relevant: true; topic: string } & DraftQuestion);

export type CurrentAffairsQuestion = {
  id: string;
  day: string;
  topic: string | null;
  questionText: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};
