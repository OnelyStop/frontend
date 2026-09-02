import type { Metadata } from "next";
import { instrument, jakarta } from "./fonts";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "@/design-system/styles/theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://onelystop.vercel.app"),
  title: {
    default: "onelystop — clear every sectional cutoff",
    template: "%s · onelystop",
  },
  description:
    "Mocks, drills, current affairs and descriptive marking for IBPS, SBI and RBI. Built around negative marking, sectional timing and what to skip.",
  openGraph: {
    type: "website",
    siteName: "onelystop",
    title: "onelystop — clear every sectional cutoff",
    description:
      "Mocks, drills, current affairs and descriptive marking for IBPS, SBI and RBI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (password managers, reader
    // tools) mutate <html>/<body> attributes before React hydrates. It only
    // silences attribute diffs one level deep, not children.
    <html
      lang="en"
      className={`${instrument.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <AppProvider>
            <SmoothScroll />
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
