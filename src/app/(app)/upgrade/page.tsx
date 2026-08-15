import type { Metadata } from "next";
import { UpgradePage } from "@/views/UpgradePage";

export const metadata: Metadata = { title: "Upgrade" };

export default function Page() {
  return <UpgradePage />;
}
