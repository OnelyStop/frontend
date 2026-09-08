import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  canPreview,
  getSubjectChapters,
} from "@/features/study/queries.server";
import { SubjectView } from "./subject-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}): Promise<Metadata> {
  const { subjectSlug } = await params;
  const data = await getSubjectChapters(subjectSlug, {
    preview: await canPreview(),
  });
  if (!data) return { title: "Knowledge base" };
  const topics = data.chapters.reduce((n, c) => n + c.topics.length, 0);
  return {
    title: data.name,
    description:
      data.description ??
      `${topics} ${data.name} topics for IBPS, SBI and RBI, arranged into ${data.chapters.length} chapters.`,
    alternates: { canonical: `/study/${subjectSlug}` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const { subjectSlug } = await params;
  const preview = await canPreview();
  const data = await getSubjectChapters(subjectSlug, { preview });
  if (!data) notFound();

  return (
    <SubjectView
      subjectSlug={subjectSlug}
      name={data.name}
      description={data.description}
      chapters={data.chapters}
    />
  );
}
