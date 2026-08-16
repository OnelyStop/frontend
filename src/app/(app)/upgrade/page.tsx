import type { Metadata } from "next";
import { UpgradeView } from "./upgrade-view";

export const metadata: Metadata = { title: "Upgrade" };

export default function Page() {
  return <UpgradeView />;
}
