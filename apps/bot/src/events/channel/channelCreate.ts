import { Effect } from "effect";
import { Events, type NonThreadGuildBasedChannel } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class ChannelCreateEvent extends Event<
  Events.ChannelCreate,
  Logger
> {
  constructor() {
    super(Events.ChannelCreate);
  }

  public execute(
    _client: Bot,
    channel: NonThreadGuildBasedChannel
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: channel.guild.id,
            action: "channel.created",
            source: "bot",
            actorId: "system",
            targetType: "channel",
            targetId: channel.id,
            targetName: channel.name
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log channel create:`, error)
        )
      );
    });
  }
}
