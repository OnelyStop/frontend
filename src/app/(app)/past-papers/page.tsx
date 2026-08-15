import type { Metadata } from "next";
import { PastPapersPage } from "@/views/PastPapersPage";

export const metadata: Metadata = { title: "Past Papers" };

export default function Page() {
  return <PastPapersPage />;
}
