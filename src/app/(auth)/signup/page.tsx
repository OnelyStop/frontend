import type { Metadata } from "next";
import { SignupView } from "./signup-view";

export const metadata: Metadata = {
  title: "Create a free account",
  description:
    "Start free: two full mocks a month under real sectional timing, daily current affairs and the whole knowledge base. No card needed.",
  alternates: { canonical: "/signup" },
};

export default function Page() {
  return <SignupView />;
}
