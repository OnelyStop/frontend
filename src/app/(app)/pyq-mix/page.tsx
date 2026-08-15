import type { Metadata } from "next";
import { PYQMixPage } from "@/views/PYQMixPage";

export const metadata: Metadata = { title: "PYQ Mix" };

export default function Page() {
  return <PYQMixPage />;
}
