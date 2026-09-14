import { AuthOnlyProviders } from "@/components/layout/AppProviders";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthOnlyProviders>{children}</AuthOnlyProviders>;
}
