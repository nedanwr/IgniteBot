import { Effect } from "effect";
import {
  Events,
  type DMChannel,
  type NonThreadGuildBasedChannel
} from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class ChannelDeleteEvent extends Event<
  Events.ChannelDelete,
  Logger
> {
  constructor() {
    super(Events.ChannelDelete);
  }

  public execute(
    _client: Bot,
    channel: DMChannel | NonThreadGuildBasedChannel
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      if (channel.isDMBased()) return;

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: channel.guild.id,
            action: "channel.deleted",
            source: "bot",
            actorId: "system",
            targetType: "channel",
            targetId: channel.id,
            targetName: channel.name
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log channel delete:`, error)
        )
      );
    });
  }
}
