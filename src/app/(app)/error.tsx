"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button, ButtonLink, Card, Empty } from "@/design-system";

// Scoped to (app) so a failed page keeps the frame, nav and rail; the root boundary takes them.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Card pad={false}>
      <Empty
        tone="warn"
        mark="!"
        title="That page did not load"
        sub="The error is logged and nothing you have saved is affected. Try again, or move on and come back to it."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/today" variant="secondary">
              Back to Today
            </ButtonLink>
          </div>
        }
      />
      {/* The digest is what ties a user's report to the trace in Sentry. */}
      {error.digest ? (
        <p className="text-ink-4 pb-6 text-center text-[12px]">
          Reference {error.digest}
        </p>
      ) : null}
    </Card>
  );
}
