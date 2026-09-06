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
  return { title: data?.name ?? "Knowledge base" };
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
