import type { Metadata } from "next";
import { canPreview, listSubjects } from "@/features/study/queries.server";
import { StudyBrowseView } from "./study-view";

export const metadata: Metadata = { title: "Knowledge base" };

export default async function Page() {
  const preview = await canPreview();
  const subjects = await listSubjects({ preview });
  return <StudyBrowseView subjects={subjects} preview={preview} />;
}
