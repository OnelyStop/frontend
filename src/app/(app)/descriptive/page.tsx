import type { Metadata } from "next";
import { DescriptiveView } from "./descriptive-view";

export const metadata: Metadata = { title: "Descriptive" };

export default function Page() {
  return <DescriptiveView />;
}
