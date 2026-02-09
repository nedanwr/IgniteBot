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

export default class ChannelUpdateEvent extends Event<
  Events.ChannelUpdate,
  Logger
> {
  constructor() {
    super(Events.ChannelUpdate);
  }

  public execute(
    _client: Bot,
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    newChannel: DMChannel | NonThreadGuildBasedChannel
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      if (oldChannel.isDMBased() || newChannel.isDMBased()) return;

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (oldChannel.name !== newChannel.name)
        changes.name = { from: oldChannel.name, to: newChannel.name };

      if (Object.keys(changes).length === 0) return;

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: newChannel.guild.id,
            action: "channel.updated",
            source: "bot",
            actorId: "system",
            targetType: "channel",
            targetId: newChannel.id,
            targetName: newChannel.name,
            metadata: changes
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log channel update:`, error)
        )
      );
    });
  }
}
