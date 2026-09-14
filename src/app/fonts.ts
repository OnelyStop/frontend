import { Instrument_Sans } from "next/font/google";

export const display = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
