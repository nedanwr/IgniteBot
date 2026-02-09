import { Effect } from "effect";
import { Events, type Guild } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class GuildUpdateEvent extends Event<
  Events.GuildUpdate,
  Logger
> {
  constructor() {
    super(Events.GuildUpdate);
  }

  public execute(
    _client: Bot,
    oldGuild: Guild,
    newGuild: Guild
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (oldGuild.name !== newGuild.name)
        changes.name = { from: oldGuild.name, to: newGuild.name };
      if (oldGuild.icon !== newGuild.icon)
        changes.icon = { from: oldGuild.icon, to: newGuild.icon };

      if (Object.keys(changes).length === 0) return;

      yield* logger.info(`Guild updated: ${newGuild.name} (${newGuild.id})`);

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: newGuild.id,
            action: "guild.updated",
            source: "bot",
            actorId: "system",
            targetType: "guild",
            targetId: newGuild.id,
            targetName: newGuild.name,
            metadata: changes
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log guild update:`, error)
        )
      );
    });
  }
}
