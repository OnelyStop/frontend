import type { Metadata } from "next";
import { canPreview, listSubjects } from "@/features/study/queries.server";
import { StudyBrowseView } from "./study-view";

export const metadata: Metadata = {
  title: "Knowledge base",
  description:
    "Every section of the bank-exam syllabus, broken into chapters and topics: quantitative aptitude, reasoning, English, banking awareness, computer awareness and exam strategy.",
  alternates: { canonical: "/study" },
};

export default async function Page() {
  const subjects = await listSubjects({ preview: await canPreview() });
  return <StudyBrowseView subjects={subjects} />;
}
