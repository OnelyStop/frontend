import type { Metadata } from "next";
import { PyqMixView } from "./pyq-mix-view";

export const metadata: Metadata = { title: "PYQ Mix" };

export default function Page() {
  return <PyqMixView />;
}
