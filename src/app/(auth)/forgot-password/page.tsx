import type { Metadata } from "next";
import { ForgotPasswordView } from "./forgot-password-view";

// A utility page with nothing to rank for.
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForgotPasswordView />;
}
