import { redirect } from "next/navigation";

// There is no standalone chapter page — the chapter tree lives on the subject
// page and in the reader's rail. This exists so walking up the URL from a topic
// (e.g. the running head's Esc) lands on the subject, not a 404.
export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string; chapterSlug: string }>;
}) {
  const { subjectSlug } = await params;
  redirect(`/study/${subjectSlug}`);
}
