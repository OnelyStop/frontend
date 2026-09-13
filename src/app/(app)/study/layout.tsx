import type { Metadata } from "next";

// The one indexable subtree under (app): the knowledge base is public and gates its own bodies.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
