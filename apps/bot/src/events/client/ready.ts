import { Effect } from "effect";
import { ActivityType, Events } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { PluginManager } from "~/managers/PluginManager";
import { AppConfig } from "~/services/config";

export default class ReadyEvent extends Event<
  Events.ClientReady,
  Logger | AppConfig
> {
  constructor() {
    super(Events.ClientReady, true);
  }

  public execute(client: Bot): Effect.Effect<void, never, Logger | AppConfig> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      yield* logger.log(`${client.user?.username} is ready!`);

      yield* Effect.tryPromise({
        try: () =>
          Promise.resolve(
            client.user?.setPresence({
              activities: [
                {
                  name: "your server!",
                  type: ActivityType.Watching
                }
              ]
            })
          ),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error("Failed to set presence:", error)
        )
      );

      const pluginManager = new PluginManager(client);
      yield* pluginManager
        .initialize()
        .pipe(
          Effect.catchAll((error) =>
            logger.error("Failed to initialize plugins:", error)
          )
        );
    });
  }
}
