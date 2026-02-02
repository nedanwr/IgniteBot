import { fileURLToPath } from "url";
import path from "path";
import { Effect, Layer } from "effect";
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  type ClientOptions
} from "discord.js";
import fs from "fs";
import fsPromises from "fs/promises";

import type { Plugin } from "./Plugin";
import { Logger } from "~/services/logger";
import { AppConfig, AppConfigLive } from "~/services/config";
import { isLoadableByEnv, toImportUrl } from "~/utils/module";
import { Event, type EventName } from "./Event";
import { DiscordClientError, EventLoadError } from "~/lib/errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function defaultEventsDir() {
  return path.resolve(__dirname, "..", "events");
}

function isValidEvent(value: unknown): value is Event<EventName, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    "name" in value &&
    typeof value.name === "string" &&
    "execute" in value &&
    typeof value.execute === "function"
  );
}

const DefaultRuntimeLayer = Layer.merge(Logger.Live, AppConfigLive);

export class Bot extends Client {
  private readonly botToken: string;
  public plugins: Collection<string, Plugin> = new Collection();
  private runtimeLayer: Layer.Layer<Logger | AppConfig> = DefaultRuntimeLayer;

  constructor(token: string, options?: ClientOptions) {
    super({
      allowedMentions: {
        parse: ["users"],
        users: [],
        roles: [],
        repliedUser: true
      },
      intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel],
      ...options
    });

    this.botToken = token;
  }

  public setRuntimeLayer(layer: Layer.Layer<Logger | AppConfig>): void {
    this.runtimeLayer = layer;
  }

  public start(): Effect.Effect<
    void,
    DiscordClientError | EventLoadError,
    Logger
  > {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;

      yield* this.loadEvents();

      yield* Effect.tryPromise({
        try: () => this.login(this.botToken),
        catch: (error) =>
          new DiscordClientError({
            operation: "login",
            cause: error
          })
      });

      yield* logger.info("Bot logged in successfully");
    });
  }

  private loadEvents(
    dir: string = defaultEventsDir()
  ): Effect.Effect<void, EventLoadError, Logger> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;

      if (!fs.existsSync(dir)) {
        yield* logger.warn(`Events directory not found`, dir);
        return;
      }

      const entries = yield* Effect.tryPromise({
        try: () => fsPromises.readdir(dir, { withFileTypes: true }),
        catch: (error) =>
          new EventLoadError({
            filePath: dir,
            cause: error
          })
      });

      for (const entry of entries) {
        const filePath = path.resolve(dir, entry.name);

        if (entry.isDirectory()) {
          yield* this.loadEvents(filePath);
          continue;
        }

        if (!isLoadableByEnv(filePath)) continue;

        yield* this.loadEvent(filePath);
      }
    });
  }

  private loadEvent(
    filePath: string
  ): Effect.Effect<void, EventLoadError, Logger> {
    const self = this;

    return Effect.gen(function* () {
      const logger = yield* Logger;

      const mod = yield* Effect.tryPromise({
        try: () => import(toImportUrl(filePath)),
        catch: (error) =>
          new EventLoadError({
            filePath,
            cause: error
          })
      });

      const EventClass = mod.default ?? mod.Event ?? null;

      if (!EventClass) {
        yield* logger.warn("Skipping event without default export:", filePath);
        return;
      }

      const instance = new EventClass();

      if (!isValidEvent(instance)) {
        yield* logger.warn(
          "Invalid event shape (missing name/execute):",
          filePath
        );
        return;
      }

      const event = instance;

      const runEventEffect = (
        effect: Effect.Effect<void, never, Logger | AppConfig>
      ) => {
        const program = effect.pipe(
          Effect.catchAllDefect((defect) =>
            Effect.gen(function* () {
              const log = yield* Logger;
              yield* log.error("Event execution failed with defect:", defect);
            })
          ),
          Effect.provide(self.runtimeLayer)
        );

        Effect.runPromise(program).catch(() => {
          // Layer construction failed - fallback to console
          console.error("Failed to run event effect (layer error)");
        });
      };

      if (event.once) {
        self.once(event.name, (...args) => {
          runEventEffect(
            event.execute(self, ...args) as Effect.Effect<
              void,
              never,
              Logger | AppConfig
            >
          );
        });
      } else {
        self.on(event.name, (...args) => {
          runEventEffect(
            event.execute(self, ...args) as Effect.Effect<
              void,
              never,
              Logger | AppConfig
            >
          );
        });
      }

      yield* logger.debug("Loaded event:", event.name);
    });
  }
}
