import type { Metadata } from "next";
import { SignupView } from "./signup-view";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return <SignupView />;
}
