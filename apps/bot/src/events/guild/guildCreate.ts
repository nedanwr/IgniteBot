import { Effect } from "effect";
import { Events, type Guild } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class GuildCreateEvent extends Event<
  Events.GuildCreate,
  Logger
> {
  constructor() {
    super(Events.GuildCreate);
  }

  public execute(
    _client: Bot,
    guild: Guild
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      yield* logger.info(`Joined guild: ${guild.name} (${guild.id})`);

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/guild-joined", { discordId: guild.id }),
        catch: (error) => error
      }).pipe(
        Effect.tap((result) =>
          logger.debug(`Updated ${(result as any).updated} guild record(s) for ${guild.id}`)
        ),
        Effect.catchAll((error) =>
          logger.error(`Failed to sync guild join to Convex:`, error)
        )
      );
    });
  }
}
