import { Poppins } from "next/font/google";

// The only family in the app: theme.css sets --font-sans to this and nothing else.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
  // Without a stated fallback the swap reflows against Times, not a sans.
  fallback: ["Arial", "Helvetica", "sans-serif"],
});
