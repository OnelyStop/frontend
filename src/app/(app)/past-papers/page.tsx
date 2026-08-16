import type { Metadata } from "next";
import { PastPapersView } from "./past-papers-view";

export const metadata: Metadata = { title: "Past Papers" };

export default function Page() {
  return <PastPapersView />;
}
