import { SlashCommandBuilder } from "discord.js";

import { Plugin } from "~/struct/Plugin";

export abstract class BasePlugin extends Plugin {
  public readonly data: SlashCommandBuilder;

  constructor(builder: SlashCommandBuilder) {
    super();
    this.data = Object.freeze(builder) as SlashCommandBuilder;
  }
}
