import { Context, Layer } from "effect";

import { env, isProd, isDev, isDebug } from "~/lib/env";

export interface AppConfigService {
  readonly clientToken: string;
  readonly clientOwnerId: string;
  readonly debug: boolean;
  readonly devGuildId: string | undefined;
  readonly isProd: boolean;
  readonly isDev: boolean;
  readonly isDebug: boolean;
}

export class AppConfig extends Context.Tag("AppConfig")<
  AppConfig,
  AppConfigService
>() {}

const appConfig: AppConfigService = {
  clientToken: env.CLIENT_TOKEN,
  clientOwnerId: env.CLIENT_OWNER_ID,
  debug: env.DEBUG,
  devGuildId: env.DEV_GUILD_ID,
  isProd,
  isDev,
  isDebug
};

export const AppConfigLive = Layer.succeed(AppConfig, appConfig);
