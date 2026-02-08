import { Effect } from "effect";
import { Events, type Message } from "discord.js";

import { Event } from "~/struct/Event";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { callBotEndpoint } from "~/services/convex";

// Check if first character could be a command prefix
// Matches common prefix characters: ! ? . - > $ % & * / \ ~ , ; : + = @
function isPotentialPrefix(char: string): boolean {
  return /^[^\w\s]$/.test(char);
}

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

      // Quick check: does this look like it could be a command?
      const firstChar = message.content[0];
      if (!firstChar || !isPotentialPrefix(firstChar)) return;

      const logger = yield* Logger;

      // Resolve command via Convex (checks prefix + looks up command in one query)
      const resolved = yield* Effect.tryPromise({
        try: () =>
          callBotEndpoint("/bot/resolve-command", {
            guildDiscordId: message.guild!.id,
            messageContent: message.content
          }),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) => {
          return Effect.gen(function* () {
            yield* logger.error("Failed to resolve command:", error);
            return null;
          });
        })
      );

      const command = (resolved as any)?.result;
      if (!command) return;

      yield* logger.debug(
        `Executing command !${command.name} in ${message.guild.name}`
      );

      // Send the response (content can be text or URL - Discord handles both)
      yield* Effect.tryPromise({
        try: () => message.reply(command.response.content),
        catch: (error) => error
      }).pipe(
        Effect.catchAll((error) =>
          logger.error("Failed to send command response:", error)
        )
      );
    });
  }
}
