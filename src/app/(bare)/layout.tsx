import { SmoothScroll } from "@/components/layout/SmoothScroll";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
