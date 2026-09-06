"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Replaces the root layout, so no app CSS reaches it — every style is inline.
const SHELL: React.CSSProperties = {
  minHeight: "100dvh",
  margin: 0,
  display: "grid",
  placeItems: "center",
  padding: "0 20px",
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  textAlign: "center",
  colorScheme: "light dark",
};

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={SHELL}>
        <title>Something went wrong · onelystop</title>
        <div style={{ maxWidth: "40ch" }}>
          <h1
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.7 }}>
            onelystop hit an error it could not recover from. It has been
            reported.
          </p>
          <p style={{ fontSize: 14 }}>
            <a href="/" style={{ color: "inherit" }}>
              Reload onelystop
            </a>
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12.5, opacity: 0.5 }}>
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
