import { Effect, Layer, Exit, Cause } from "effect";

import { env, isDebug } from "~/lib/env";
import { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { AppConfig, AppConfigLive } from "~/services/config";
import { DiscordClientError, EventLoadError } from "~/lib/errors";

const REQUIRED_NODE_VERSION = "20.0.0";

function isNodeVersionAtLeast(required: string): boolean {
  const toNums = (v: string) =>
    v.split(".").map((x: string) => parseInt(x, 10));
  const [rMajor, rMinor, rPatch] = toNums(required);
  const [aMajor, aMinor, aPatch] = toNums(process.versions.node);

  if (aMajor !== rMajor) return aMajor > rMajor;
  if (aMinor !== rMinor) return aMinor > rMinor;
  return aPatch >= rPatch;
}

const MainLive = Layer.merge(AppConfigLive, Logger.make(isDebug));

const makeProgram = (runtimeLayer: Layer.Layer<Logger | AppConfig>) =>
  Effect.gen(function* () {
    const logger = yield* Logger;

    yield* logger.info("Starting bot...");

    const client = new Bot(env.CLIENT_TOKEN);
    client.setRuntimeLayer(runtimeLayer);

    yield* client.start();
  });

const handleError = (
  error: DiscordClientError | EventLoadError | unknown
): void => {
  if (error instanceof DiscordClientError) {
    console.error(`Discord client error (${error.operation}):`, error.cause);
  } else if (error instanceof EventLoadError) {
    console.error(`Failed to load event: ${error.filePath}`, error.cause);
  } else {
    console.error("Unexpected error:", error);
  }
  process.exit(1);
};

async function main() {
  if (!isNodeVersionAtLeast(REQUIRED_NODE_VERSION)) {
    console.error(
      `Node.js ${REQUIRED_NODE_VERSION} or higher is required. Detected ${process.versions.node}`
    );
    process.exit(1);
  }

  process.on("uncaughtException", (err) => {
    console.error("(uncaughtException):", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("(unhandledRejection):", reason);
  });

  process.on("SIGINT", () => {
    console.info("SIGINT received, exiting...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.info("SIGTERM received, exiting...");
    process.exit(0);
  });

  const program = makeProgram(MainLive);

  const exit = await Effect.runPromiseExit(
    program.pipe(Effect.provide(MainLive))
  );

  if (Exit.isFailure(exit)) {
    const error = Cause.squash(exit.cause);
    handleError(error);
  }
}

main();
