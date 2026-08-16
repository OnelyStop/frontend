import type { Metadata } from "next";
import { LoginView } from "./login-view";

export const metadata: Metadata = { title: "Sign in" };

// Reading searchParams here rather than with useSearchParams in the view keeps
// the form server-rendered. useSearchParams would suspend the whole subtree,
// so only the fallback reached the HTML.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <LoginView from={from ?? "/home"} />;
}
