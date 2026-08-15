import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/views/ForgotPasswordPage";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return <ForgotPasswordPage />;
}
