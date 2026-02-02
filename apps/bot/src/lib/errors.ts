import { Data } from "effect";

export class EventLoadError extends Data.TaggedError("EventLoadError")<{
  readonly filePath: string;
  readonly cause?: unknown;
}> {}

export class PluginLoadError extends Data.TaggedError("PluginLoadError")<{
  readonly filePath: string;
  readonly cause?: unknown;
}> {}

export class PluginExecutionError extends Data.TaggedError(
  "PluginExecutionError"
)<{
  readonly pluginName: string;
  readonly cause: unknown;
}> {}

export class DiscordClientError extends Data.TaggedError("DiscordClientError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

/**
 * Extracts the underlying cause from an error if it has one,
 * otherwise returns the error itself.
 */
export function unwrapErrorCause(error: unknown): unknown {
  if (
    error !== null &&
    typeof error === "object" &&
    "cause" in error &&
    error.cause !== undefined
  ) {
    return error.cause;
  }
  return error;
}
