import type { Metadata } from "next";
import { CurrentAffairsView } from "./current-affairs-view";

export const metadata: Metadata = { title: "Current affairs" };

export default function Page() {
  return <CurrentAffairsView />;
}
