import { Instrument_Sans } from "next/font/google";

// A grotesque, not a geometric: Poppins' round bowls and heavy 700 read bulky at display sizes.
export const display = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
