import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { Effect } from "effect";
import { AlignmentEnum, AsciiTable3 as AsciiTable } from "ascii-table3";
import { Routes } from "discord.js";

import type { Plugin } from "~/struct/Plugin";
import type { Bot } from "~/struct/Client";
import { Logger } from "~/services/logger";
import { AppConfig } from "~/services/config";
import { isLoadableByEnv, toImportUrl } from "~/utils/module";
import { DiscordClientError, PluginLoadError } from "~/lib/errors";

type LoadedPlugin = {
  instance: Plugin;
  name: string;
  category: string | null;
  fileName: string;
};

type PluginFile = {
  absPath: string;
  relPath: string;
  relDir: string;
  fileName: string;
  isHelper: boolean;
  isBase: boolean;
  isPluginCandidate: boolean;
};

export class PluginManager {
  private client: Bot;

  constructor(client: Bot) {
    this.client = client;
  }

  public initialize(): Effect.Effect<
    void,
    PluginLoadError | DiscordClientError,
    Logger | AppConfig
  > {
    return Effect.gen(this, function* () {
      const pluginsRoot = this.pluginsRoot();
      const files = yield* this.walkFiles(pluginsRoot);

      const hasCategorized = files.some(
        (f) => f.isPluginCandidate && f.relDir !== ""
      );

      const loaded = yield* this.loadPlugins(files, hasCategorized);
      yield* this.registerPlugins(loaded.map((p) => p.instance));
      yield* this.printTable(loaded, hasCategorized);
    });
  }

  private pluginsRoot(): string {
    return path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "..",
      "plugins"
    );
  }

  private walkFiles(
    root: string
  ): Effect.Effect<PluginFile[], PluginLoadError, Logger> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;
      const out: PluginFile[] = [];

      if (!fs.existsSync(root)) {
        yield* logger.warn(`Plugins directory not found`, root);
        return out;
      }

      const walk = (dir: string): Effect.Effect<void, PluginLoadError, never> =>
        Effect.gen(function* () {
          const entries = yield* Effect.tryPromise({
            try: () => fsPromises.readdir(dir, { withFileTypes: true }),
            catch: (error) =>
              new PluginLoadError({
                filePath: dir,
                cause: error
              })
          });

          for (const entry of entries) {
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              yield* walk(abs);
              continue;
            }

            const relPath = path.relative(root, abs);
            const relDir =
              path.dirname(relPath) === "." ? "" : path.dirname(relPath);
            const fileName = path.basename(abs);

            const isHelper = fileName.startsWith("_");
            const isBase = isBaseFile(fileName);
            const loadableByEnv = isLoadableByEnv(fileName);
            const isPluginCandidate = loadableByEnv && !isHelper && !isBase;

            out.push({
              absPath: abs,
              relPath,
              relDir,
              fileName,
              isHelper,
              isBase,
              isPluginCandidate
            });
          }
        });

      yield* walk(root);
      return out.sort((a, b) => a.fileName.localeCompare(b.fileName));
    });
  }

  private loadPlugins(
    files: PluginFile[],
    categorized: boolean
  ): Effect.Effect<LoadedPlugin[], PluginLoadError, Logger> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;
      this.client.plugins.clear();
      const loaded: LoadedPlugin[] = [];

      for (const file of files) {
        if (!file.isPluginCandidate) continue;

        const category =
          categorized && file.relDir ? normalizeCategory(file.relDir) : null;

        const result = yield* Effect.tryPromise({
          try: () => import(toImportUrl(file.absPath)),
          catch: (error) =>
            new PluginLoadError({
              filePath: file.relPath,
              cause: error
            })
        }).pipe(
          Effect.flatMap((mod) =>
            Effect.gen(function* () {
              const PluginClass = mod.default ?? mod.Plugin ?? null;

              if (!PluginClass) {
                yield* logger.warn(
                  "Skipping file (no default export):",
                  file.relPath
                );
                return null;
              }

              const instance = new PluginClass();

              if (!isValidPlugin(instance)) {
                yield* logger.warn(
                  "Skipping file (invalid plugin shape):",
                  file.relPath
                );
                return null;
              }

              return { instance, category, fileName: file.fileName };
            })
          ),
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* logger.error("Failed to load plugin:", file.relPath, error);
              return null;
            })
          )
        );

        if (result) {
          const name = result.instance.data.name || "(unnamed)";

          if (this.client.plugins.has(name)) {
            yield* logger.warn(
              `Duplicate plugin name detected: ${name}. Overwriting...`
            );
          }

          this.client.plugins.set(name, result.instance);
          loaded.push({
            instance: result.instance,
            name,
            category: result.category,
            fileName: result.fileName
          });
        }
      }

      return loaded;
    });
  }

  private printTable(
    loaded: LoadedPlugin[],
    categorized: boolean
  ): Effect.Effect<void, never, Logger> {
    return Effect.gen(function* () {
      const logger = yield* Logger;

      if (loaded.length === 0) {
        yield* logger.warn("No plugins discovered.");
        return;
      }

      const table = categorized
        ? new AsciiTable("Plugin Handler").setHeading(
            "Category",
            "Plugin",
            "Status"
          )
        : new AsciiTable("Plugin Handler").setHeading("Plugin", "Status");

      table.setAlign(0, AlignmentEnum.LEFT);

      if (categorized) {
        const byCat = new Map<string, LoadedPlugin[]>();
        for (const p of loaded) {
          const key = p.category ?? "(root)";
          const arr = byCat.get(key) ?? [];
          arr.push(p);
          byCat.set(key, arr);
        }

        for (const [cat, list] of byCat) {
          table.addRow(cat, "", "");
          for (const p of list) {
            table.addRow("", p.name, "\u2705");
          }
        }
      } else {
        for (const p of loaded) {
          table.addRow(p.name, "\u2705");
        }
      }

      yield* logger.log(table.toString());
    });
  }

  private registerPlugins(
    plugins: Plugin[]
  ): Effect.Effect<void, DiscordClientError, Logger | AppConfig> {
    return Effect.gen(this, function* () {
      const logger = yield* Logger;
      const config = yield* AppConfig;
      const count = plugins.length;

      if (count === 0) {
        yield* logger.warn("No plugins to register; skipping.");
        return;
      }

      yield* logger.info(`Refreshing ${count} application (/) commands...`);

      const appId = this.client.user?.id;
      if (!appId) {
        return yield* Effect.fail(
          new DiscordClientError({
            operation: "registerCommands",
            cause: new Error("Cannot register commands: client user not ready")
          })
        );
      }

      const body = plugins.map((p) => p.data);
      const devGuildId = config.devGuildId;

      yield* Effect.tryPromise({
        try: async () => {
          if (devGuildId) {
            await this.client.rest.put(
              Routes.applicationGuildCommands(appId, devGuildId),
              { body }
            );
          } else {
            await this.client.rest.put(Routes.applicationCommands(appId), {
              body
            });
          }
        },
        catch: (error) =>
          new DiscordClientError({
            operation: "registerCommands",
            cause: error
          })
      });

      if (devGuildId) {
        yield* logger.info(
          `Registered ${count} guild commands to ${devGuildId}.`
        );
      } else {
        yield* logger.info(`Registered ${count} global commands.`);
      }
    });
  }
}

function isBaseFile(fileName: string): boolean {
  const base = fileName.toLowerCase();
  return (
    base === "base.ts" ||
    base === "base.js" ||
    base === "base.mjs" ||
    base === "base.cjs"
  );
}

function isValidPlugin(p: unknown): p is Plugin {
  return (
    p !== null &&
    typeof p === "object" &&
    "data" in p &&
    p.data !== null &&
    typeof p.data === "object" &&
    "name" in p.data &&
    typeof p.data.name === "string" &&
    "execute" in p &&
    typeof p.execute === "function"
  );
}

function normalizeCategory(relDir: string): string {
  return relDir.replace(/\\/g, "/");
}
