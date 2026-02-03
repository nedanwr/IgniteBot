import { Effect } from "effect";
import { Events, type Message } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { convex, api } from "~/services/convex";

const COMMAND_PREFIX = "!";

export default class MessageCreateEvent extends Event<
  Events.MessageCreate,
  Logger
> {
  constructor() {
    super(Events.MessageCreate);
  }

  public execute(
    _client: Bot,
    message: Message
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      // Check if message starts with command prefix
      if (!message.content.startsWith(COMMAND_PREFIX)) return;

      const logger = yield* Logger;

      // Extract command name
      const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
      const commandName = args[0]?.toLowerCase();

      if (!commandName) return;

      // Look up the command in Convex
      const command = yield* Effect.tryPromise({
        try: () =>
          convex.query(api.commands.getByGuildAndName, {
            guildDiscordId: message.guild!.id,
            name: commandName
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) => {
          return Effect.gen(function* () {
            yield* logger.error("Failed to fetch command:", error);
            return null;
          });
        })
      );

      if (!command || !command.enabled) return;

      yield* logger.debug(
        `Executing command !${commandName} in ${message.guild.name}`
      );

      // Send the response
      yield* Effect.tryPromise({
        try: () => message.reply(command.response),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error("Failed to send command response:", error)
        )
      );
    });
  }
}
