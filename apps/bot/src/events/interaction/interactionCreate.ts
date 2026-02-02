import { Effect } from "effect";
import {
  Events,
  type Interaction,
  DiscordAPIError,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction
} from "discord.js";

import { Event } from "~/struct/Event";
import { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { unwrapErrorCause } from "~/lib/errors";

export default class InteractionCreate extends Event<
  Events.InteractionCreate,
  Logger
> {
  constructor() {
    super(Events.InteractionCreate);
  }

  public execute(
    client: Bot,
    interaction: Interaction
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(this, function* () {
      if (interaction.isChatInputCommand()) {
        yield* this.handleChatInput(client, interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        yield* this.handleAutocomplete(client, interaction);
        return;
      }
    });
  }

  private handleChatInput(
    client: Bot,
    interaction: ChatInputCommandInteraction
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;
      const plugin = client.plugins.get(interaction.commandName);

      if (!plugin) {
        yield* logger.warn(`Plugin not found: ${interaction.commandName}`);
        if (!interaction.deferred && !interaction.replied) {
          yield* Effect.tryPromise({
            try: () =>
              interaction.reply({
                content: "This plugin is not available.",
                ephemeral: true
              }),
            catch: (error) => error
          }).pipe(
            Effect.catchAll((error) =>
              logger.debug("Failed to send 'plugin not found' reply:", error)
            )
          );
        }
        return;
      }

      const started = Date.now();

      yield* plugin.execute(interaction, client).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* logger.error(
              `plugin.execute(${plugin.data.name}):`,
              unwrapErrorCause(error)
            );

            if (!interaction.deferred && !interaction.replied) {
              yield* Effect.tryPromise({
                try: () =>
                  interaction.reply({
                    content: "An error occurred while executing this command.",
                    ephemeral: true
                  }),
                catch: (e) => e
              }).pipe(
                Effect.catchAll((e) =>
                  e instanceof DiscordAPIError
                    ? Effect.void
                    : logger.debug("Failed to send error reply:", e)
                )
              );
            }
          })
        ),
        Effect.ensuring(
          Effect.gen(function* () {
            const took = Date.now() - started;
            yield* logger.debug(
              `Plugin ${plugin.data.name} executed in ${took}ms`
            );
          })
        )
      );
    });
  }

  private handleAutocomplete(
    client: Bot,
    interaction: AutocompleteInteraction
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;
      const plugin = client.plugins.get(interaction.commandName);

      if (!plugin) {
        yield* logger.warn(
          `Plugin not found for autocomplete: ${interaction.commandName}`
        );
        return;
      }

      if (!plugin.autocomplete) {
        yield* logger.warn(
          `Plugin ${plugin.data.name} does not have an autocomplete handler.`
        );
        return;
      }

      yield* plugin
        .autocomplete(interaction, client)
        .pipe(
          Effect.catchAll((error) =>
            logger.error(
              `plugin.autocomplete(${plugin.data.name}):`,
              unwrapErrorCause(error)
            )
          )
        );
    });
  }
}
