// A measurement ID only names the property to report into, so it ships in the bundle; leave it unset anywhere its traffic is not real.
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
