import { Context, Effect, Layer } from "effect";
import { format } from "date-fns";

const ts = () => `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}]`;

const TTY = process.stdout.isTTY === true;
const color = (code: number, text: string) =>
  TTY ? `\x1b[${code}m${text}\x1b[0m` : text;

const LVL = {
  INFO: color(32, "[INFO]"),
  WARN: color(33, "[WARN]"),
  ERROR: color(31, "[ERROR]"),
  DEBUG: color(36, "[DEBUG]"),
  LOG: color(37, "[LOG]")
};

export interface LoggerService {
  readonly info: (...args: unknown[]) => Effect.Effect<void>;
  readonly warn: (...args: unknown[]) => Effect.Effect<void>;
  readonly error: (...args: unknown[]) => Effect.Effect<void>;
  readonly debug: (...args: unknown[]) => Effect.Effect<void>;
  readonly log: (...args: unknown[]) => Effect.Effect<void>;
}

const makeLogger = (isDebug: boolean): LoggerService => ({
  info: (...args) =>
    Effect.sync(() => console.info(`${ts()} ${LVL.INFO}`, ...args)),
  warn: (...args) =>
    Effect.sync(() => console.warn(`${ts()} ${LVL.WARN}`, ...args)),
  error: (...args) =>
    Effect.sync(() => console.error(`${ts()} ${LVL.ERROR}`, ...args)),
  debug: (...args) =>
    Effect.sync(() => {
      if (isDebug) {
        console.debug(`${ts()} ${LVL.DEBUG}`, ...args);
      }
    }),
  log: (...args) =>
    Effect.sync(() => console.log(`${ts()} ${LVL.LOG}`, ...args))
});

export class Logger extends Context.Tag("Logger")<Logger, LoggerService>() {
  static readonly make = (isDebug: boolean) =>
    Layer.succeed(Logger, makeLogger(isDebug));

  static readonly Live = Layer.succeed(Logger, makeLogger(true));

  static readonly Test = Layer.succeed(Logger, makeLogger(false));
}
