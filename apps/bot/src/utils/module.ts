import { pathToFileURL } from "url";

import { isProd } from "~/lib/env";

/**
 * Returns true if the filename is importable based on runtime context.
 * - dev (running from src/): .ts/.tsx and .js/.mjs/.cjs
 * - prod (running from dist/): only .js/.mjs/.cjs
 * Skips .d.ts, .map, and dotfiles.
 */
export function isLoadableByEnv(filename: string): boolean {
  const base = filename.includes("/") ? filename.split("/").pop()! : filename;

  if (base.startsWith(".") || base.endsWith(".d.ts") || base.endsWith(".map")) {
    return false;
  }

  if (isProd) {
    return (
      base.endsWith(".js") || base.endsWith(".mjs") || base.endsWith(".cjs")
    );
  }

  return (
    base.endsWith(".js") ||
    base.endsWith(".mjs") ||
    base.endsWith(".cjs") ||
    base.endsWith(".ts") ||
    base.endsWith(".tsx")
  );
}

export function toImportUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}
