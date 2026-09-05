export type OptionKey = "A" | "B" | "C" | "D";

export type CurrentAffairsQuestion = {
  id: string;
  day: string;
  topic: string | null;
  questionText: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};
