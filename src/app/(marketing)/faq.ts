import { EXAMS, DESCRIPTIVE_EXAMS } from "@/data/navigation";
import { PLAN_LIMITS } from "@/features/billing/limits";

const free = PLAN_LIMITS.free;

/** One list drives both the section on the page and its FAQPage markup, so the two cannot drift. */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Is onelystop free?",
    answer: `Yes, and the free plan is not a trial. It covers the whole knowledge base, your private notes, ${free.mocksPerMonth} full mocks a month, ${free.drillsPerDay} drills a day, ${free.descriptiveMarkingsPerMonth} descriptive markings a month, ${free.askOnelyPerMonth} Ask Onely questions a month and the last ${free.currentAffairsDays} days of current affairs. No card, no expiry.`,
  },
  {
    question: "Which exams does it cover?",
    answer: `${EXAMS.slice(0, -1).join(", ")} and ${EXAMS[EXAMS.length - 1]}. Mocks run to each paper's own sectional structure and timing rather than a single generic pattern.`,
  },
  {
    question: "Does it account for negative marking?",
    answer:
      "Yes. Every paper is scored the way the real one is, with the quarter-mark penalty applied, so your working grade reflects what you would actually have scored and every attempt-or-skip decision is priced against it.",
  },
  {
    question: "How is the descriptive paper marked?",
    answer: `A language model marks your answer against the mark scheme point by point and shows which points you hit and which you missed, for ${DESCRIPTIVE_EXAMS.join(" and ")}. It is practice guidance, not an official score, and no examiner sees it.`,
  },
  {
    question: "What is in the knowledge base?",
    answer:
      "Structured lessons across quantitative aptitude, reasoning ability, English, banking awareness, computer awareness and exam strategy — each topic with worked examples, a practice set and flashcards. You can read the syllabus for any topic without an account.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. onelystop runs in the browser on a phone or a laptop, and your progress follows the account rather than the device.",
  },
];
