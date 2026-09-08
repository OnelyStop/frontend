import { Instrument_Sans, Plus_Jakarta_Sans, Poppins } from "next/font/google";

// Instrument is too narrow at display sizes to carry a 30px card title.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

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
  // Without a stated fallback the swap reflows against Times, not a sans.
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
