import type { Metadata } from "next";
import { CallbackView } from "./callback-view";

// A one-time token lands here; there is nothing to index and nothing to follow.
export const metadata: Metadata = {
  title: "Signing you in",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CallbackView />;
}
