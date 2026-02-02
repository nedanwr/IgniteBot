import { Effect } from "effect";
import type { ClientEvents } from "discord.js";

import type { Bot } from "./Client";

export type EventName = keyof ClientEvents;

export abstract class Event<K extends EventName, R = never> {
  public readonly name: K;
  public readonly once: boolean;

  constructor(name: K, once: boolean = false) {
    this.name = name;
    this.once = once;
  }

  public abstract execute(
    client: Bot,
    ...args: ClientEvents[K]
  ): Effect.Effect<void, never, R>;
}
