import type { Metadata } from "next";
import { MarkerView } from "./marker-view";

export const metadata: Metadata = { title: "Answer Marker" };

export default function Page() {
  return <MarkerView />;
}
