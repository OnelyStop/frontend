import type { Metadata } from "next";
import { ResetPasswordView } from "./reset-password-view";

// Reached only from a single-use emailed link; never a search result.
export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordView />;
}
