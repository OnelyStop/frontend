import type { Metadata } from "next";
import { ButtonLink } from "@/design-system";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-100 text-center">
        <p className="text-ink-3 tnum text-[13px]">404</p>
        <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.03em]">
          That page doesn&rsquo;t exist
        </h1>
        <p className="text-ink-2 mt-2 text-[14px] leading-relaxed">
          The link may be out of date, or the page may have moved.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/today">Back to Today</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Home page
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
