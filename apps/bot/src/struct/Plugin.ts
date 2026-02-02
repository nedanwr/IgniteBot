import { Effect } from "effect";
import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction
} from "discord.js";

import type { Bot } from "./Client";
import type { PluginExecutionError } from "~/lib/errors";
import type { Logger } from "~/services/logger";

export abstract class Plugin {
  public abstract readonly data: SlashCommandBuilder;

  public abstract execute(
    interaction: ChatInputCommandInteraction,
    client: Bot
  ): Effect.Effect<void, PluginExecutionError, Logger>;

  public autocomplete?(
    interaction: AutocompleteInteraction,
    client: Bot
  ): Effect.Effect<void, PluginExecutionError, Logger>;
}
