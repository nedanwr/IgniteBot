import { Effect } from "effect";
import { Events, type Role } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class RoleCreateEvent extends Event<
  Events.GuildRoleCreate,
  Logger
> {
  constructor() {
    super(Events.GuildRoleCreate);
  }

  public execute(
    _client: Bot,
    role: Role
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: role.guild.id,
            action: "role.created",
            source: "bot",
            actorId: "system",
            targetType: "role",
            targetId: role.id,
            targetName: role.name
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log role create:`, error)
        )
      );
    });
  }
}
