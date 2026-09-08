import type { Metadata } from "next";
import { requestCurrency } from "@/features/billing/currency";
import { listPlans } from "@/features/billing/plans.server";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/config/site";
import { FAQ } from "./faq";
import { LandingView } from "./landing-view";

const LANDING_TITLE =
  "Bank exam mocks, drills and descriptive marking — onelystop";

export const metadata: Metadata = {
  title: { absolute: LANDING_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { url: SITE_URL, title: LANDING_TITLE },
  twitter: { title: LANDING_TITLE },
};

export default async function Page() {
  const currency = await requestCurrency();

  const application = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    publisher: { "@id": `${SITE_URL}/#organisation` },
    // The free plan is a product fact, not a fetched price — it never expires.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: currency,
      description:
        "Free plan: two full mocks a month, daily current affairs and the whole knowledge base.",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <JsonLd data={application} />
      <JsonLd data={faqPage} />
      <LandingView
        prices={await listPlans(currency)}
        billingEnabled={process.env.BILLING_ENABLED === "true"}
      />
    </>
  );
}
