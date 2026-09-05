import { redirect } from "next/navigation";

// No standalone chapter page exists; this is so walking up the URL from a
// topic (the running head's Esc) lands on the subject, not a 404.
export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string; chapterSlug: string }>;
}) {
  const { subjectSlug } = await params;
  redirect(`/study/${subjectSlug}`);
}
