import { QueryProvider } from "@/context/QueryProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
