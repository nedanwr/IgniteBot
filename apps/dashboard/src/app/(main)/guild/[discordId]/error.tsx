"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GuildError({
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
    <div className="grain flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-foreground mb-2 text-lg font-medium">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          An error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
