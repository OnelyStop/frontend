import { BANKING_EXAMS } from "@/data/navigation";
import { PLAN_LIMITS, quotaPhrase } from "@/features/billing/limits";

const free = PLAN_LIMITS.free;

/** One list drives both the section on the page and its FAQPage markup, so the two cannot drift. */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Is onelystop free?",
    answer: `Yes, and it does not expire. Free gives you the first ${free.knowledgeBaseTopicsPerSubject} topics of every subject, ${quotaPhrase(free.mocks, "full mocks")}, ${quotaPhrase(free.drills, "drills")}, ${free.currentAffairsDays} days of current affairs on a ${free.currentAffairsDelayDays}-day delay, ${free.privateNotes} private notes and ${free.mockPapers} mock papers. The two AI features are a trial rather than an allowance: ${free.descriptiveMarkings.cap} descriptive markings and ${free.askOnely.cap} Ask Onely questions in total, not per month. No card.`,
  },
  {
    question: "Which exams does it cover?",
    answer: `${BANKING_EXAMS.slice(0, -1).join(", ")} and ${BANKING_EXAMS[BANKING_EXAMS.length - 1]}. Mocks run to each paper's own sectional structure and timing rather than a single generic pattern.`,
  },
  {
    question: "Does it account for negative marking?",
    answer:
      "Yes. Every paper is scored the way the real one is, with the quarter-mark penalty applied, so your working grade reflects what you would actually have scored and every attempt-or-skip decision is priced against it.",
  },
  {
    question: "How is the descriptive paper marked?",
    answer:
      "A language model marks your answer against the mark scheme point by point and shows which points you hit and which you missed, across the letter and essay tasks a Mains paper sets. It is practice guidance, not an official score, and no examiner sees it.",
  },
  {
    question: "What is in the knowledge base?",
    answer: `Structured lessons across quantitative aptitude, reasoning ability, English, banking awareness, computer awareness and exam strategy — each topic with worked examples, a practice set and flashcards. You can read the syllabus for any topic without an account, and a free account opens the first ${free.knowledgeBaseTopicsPerSubject} topics of every subject in full.`,
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. onelystop runs in the browser on a phone or a laptop, and your progress follows the account rather than the device.",
  },
];
