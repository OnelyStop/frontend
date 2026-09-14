import type { Metadata } from "next";
import { CallbackView } from "./callback-view";

export const metadata: Metadata = {
  title: "Signing you in",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CallbackView />;
}
