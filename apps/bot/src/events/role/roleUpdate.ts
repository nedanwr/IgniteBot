import { Effect } from "effect";
import { Events, type Role } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

export default class RoleUpdateEvent extends Event<
  Events.GuildRoleUpdate,
  Logger
> {
  constructor() {
    super(Events.GuildRoleUpdate);
  }

  public execute(
    _client: Bot,
    oldRole: Role,
    newRole: Role
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (oldRole.name !== newRole.name)
        changes.name = { from: oldRole.name, to: newRole.name };
      if (oldRole.color !== newRole.color)
        changes.color = { from: oldRole.color, to: newRole.color };

      if (Object.keys(changes).length === 0) return;

      yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/audit-log", {
            guildDiscordId: newRole.guild.id,
            action: "role.updated",
            source: "bot",
            actorId: "system",
            targetType: "role",
            targetId: newRole.id,
            targetName: newRole.name,
            metadata: changes
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error(`Failed to log role update:`, error)
        )
      );
    });
  }
}
