import type { Metadata } from "next";
import { ResetPasswordView } from "./reset-password-view";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordView />;
}
