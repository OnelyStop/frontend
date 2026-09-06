"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/design-system";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-100 text-center">
        <h1 className="text-[24px] font-semibold tracking-[-0.03em]">
          Something went wrong
        </h1>
        <p className="text-ink-2 mt-2 text-[14px] leading-relaxed">
          The page failed to load. It has been reported, and trying again often
          clears it.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={retry}>
            <RotateCw size={15} strokeWidth={2} />
            Try again
          </Button>
          <ButtonLink href="/home" variant="secondary">
            Back to Today
          </ButtonLink>
        </div>

        {/* Next replaces a Server Component's message with this hash in
            production, and it is what matches the entry in our logs. */}
        {error.digest ? (
          <p className="text-ink-3 mt-8 text-[12.5px]">
            Reference <span className="tnum">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </main>
  );
}
