import { requestCurrency } from "@/features/billing/currency";
import { listPlans } from "@/features/billing/plans.server";
import { LandingView } from "./landing-view";

export default async function Page() {
  return (
    <LandingView
      prices={await listPlans(await requestCurrency())}
      billingEnabled={process.env.BILLING_ENABLED === "true"}
    />
  );
}
