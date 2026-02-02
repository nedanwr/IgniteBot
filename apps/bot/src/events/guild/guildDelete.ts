import { Effect } from "effect";
import { Events, type Guild } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { convex, api } from "~/services/convex";

export default class GuildDeleteEvent extends Event<
  Events.GuildDelete,
  Logger
> {
  constructor() {
    super(Events.GuildDelete);
  }

  public execute(
    _client: Bot,
    guild: Guild
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      yield* logger.info(`Left guild: ${guild.name} (${guild.id})`);

      yield* Effect.tryPromise({
        try: () =>
          convex.mutation(api.guilds.botLeftGuild, { discordId: guild.id }),
        catch: (error) => error
      }).pipe(
        Effect.tap((updated) =>
          logger.debug(`Updated ${updated} guild record(s) for ${guild.id}`)
        ),
        Effect.catchAll((error) =>
          logger.error(`Failed to sync guild leave to Convex:`, error)
        )
      );
    });
  }
}
