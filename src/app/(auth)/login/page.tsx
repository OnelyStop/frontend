import type { Metadata } from "next";
import { safeInternalPath } from "@/features/auth/redirect";
import { LoginView } from "./login-view";

export const metadata: Metadata = { title: "Sign in" };

// useSearchParams would suspend the subtree, so only the fallback reached the HTML.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <LoginView from={safeInternalPath(from)} />;
}
