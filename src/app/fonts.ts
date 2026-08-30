import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";

export const instrument = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-instrument",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

// Marketing overrides the family inside .mk-shell; the app stays on Instrument.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});
