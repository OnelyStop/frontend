import type { Metadata } from "next";
import { InterviewView } from "./interview-view";

export const metadata: Metadata = { title: "AI Interview" };

export default function Page() {
  return <InterviewView />;
}
