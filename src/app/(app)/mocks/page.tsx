import type { Metadata } from "next";
import { MocksView } from "./mocks-view";

export const metadata: Metadata = { title: "Mocks" };

export default function Page() {
  return <MocksView />;
}
