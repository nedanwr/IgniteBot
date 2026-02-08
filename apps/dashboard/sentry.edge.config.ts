// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8b0a60b71d27ab7a7af354897a22f5dd@o4507600260300800.ingest.us.sentry.io/4510816948715520",

  tracesSampleRate: 0.2,
  enableLogs: true
});
