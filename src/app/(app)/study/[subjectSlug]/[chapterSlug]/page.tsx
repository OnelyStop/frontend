import { redirect } from "next/navigation";

// So walking up from a topic (the running head's Esc) lands on the subject, not a 404.
export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string; chapterSlug: string }>;
}) {
  const { subjectSlug } = await params;
  redirect(`/study/${subjectSlug}`);
}
