import type { Metadata } from "next";
// Cookieless and unlinked to a person, so it needs no consent banner.
import { Analytics } from "@vercel/analytics/next";
import { instrument, jakarta } from "./fonts";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  EXAM_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/config/site";
import "@/design-system/styles/theme.css";

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: EXAM_KEYWORDS,
  category: "education",
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // Indian phone-shaped numbers in mark schemes should not become tel: links.
  formatDetection: { telephone: false, address: false, email: false },
  // No canonical or og:url here — metadata is inherited, so every page would claim to be the home page.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organisation`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESCRIPTION,
  email: SUPPORT_EMAIL,
  areaServed: { "@type": "Country", name: "India" },
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organisation` },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${instrument.variable} ${jakarta.variable}`}>
      <body suppressHydrationWarning>
        <JsonLd data={ORGANISATION} />
        <JsonLd data={WEBSITE} />
        <AuthProvider>
          <AppProvider>
            <SmoothScroll />
            {children}
          </AppProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
