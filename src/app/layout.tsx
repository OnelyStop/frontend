import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "@/styles/tokens.css";
import "@/styles/global.css";

// next/font self-hosts the file, so there's no render-blocking CDN request
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onelystop.vercel.app"),
  title: {
    default: "onelystopp — your one stop from first mock to A*",
    template: "%s · onelystopp",
  },
  description:
    "Question bank, past papers, AI marking, and spaced revision in one place. Track your working grade all the way to A*.",
  openGraph: {
    type: "website",
    siteName: "onelystopp",
    title: "onelystopp — your one stop from first mock to A*",
    description:
      "Question bank, past papers, AI marking, and spaced revision in one place.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
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
