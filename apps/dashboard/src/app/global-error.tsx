"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.5rem"
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: "#888", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #333",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
