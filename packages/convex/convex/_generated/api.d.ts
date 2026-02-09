/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as commands from "../commands.js";
import type * as guildSettings from "../guildSettings.js";
import type * as guilds from "../guilds.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_plugins from "../lib/plugins.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLog: typeof auditLog;
  auth: typeof auth;
  commands: typeof commands;
  guildSettings: typeof guildSettings;
  guilds: typeof guilds;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/crypto": typeof lib_crypto;
  "lib/plugins": typeof lib_plugins;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
