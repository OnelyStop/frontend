export type ArticleSource = "newsdata_io" | "rbi_rss" | "pib_rss" | "sebi_rss";
export type ArticleScope = "national" | "international";

export type RawArticle = {
  source: ArticleSource;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date;
  scope: ArticleScope;
};

export type OptionKey = "A" | "B" | "C" | "D";

export type DraftQuestion = {
  questionText: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};

export type GeneratedQuestion =
  { relevant: false } | ({ relevant: true; topic: string } & DraftQuestion);
