import { Schema } from "effect";
import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  loadDotenv({ path: envFile });
}

const EnvSchema = Schema.Struct({
  CLIENT_TOKEN: Schema.String.pipe(Schema.minLength(1)),
  CLIENT_OWNER_ID: Schema.String.pipe(Schema.minLength(1)),
  CONVEX_URL: Schema.String.pipe(Schema.minLength(1)),
  DEBUG: Schema.optionalWith(Schema.BooleanFromUnknown, {
    default: () => false
  }),
  DEV_GUILD_ID: Schema.optional(Schema.String)
});

export type Env = Schema.Schema.Type<typeof EnvSchema>;

function validateEnv(): Env {
  const result = Schema.decodeUnknownSync(EnvSchema)(process.env);
  return result;
}

function createEnv() {
  try {
    return validateEnv();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown validation error";
    const lines = message.split("\n").filter((line) => line.trim());

    console.error("Environment validation failed:");
    lines.forEach((line) => console.error(`  ${line}`));
    console.error(
      "\nCheck your .env (at project root) and environment configuration."
    );
    process.exit(1);
  }
}

export const env = createEnv();

/**
 * Auto-detect if running from compiled output (dist/) or source (src/).
 * When running via `tsx src/index.ts`, import.meta.url points to src/.
 * When running via `node dist/index.js`, it points to dist/.
 */
const currentFilePath = fileURLToPath(import.meta.url);
export const isProd = currentFilePath.includes("/dist/");
export const isDev = !isProd;

/** Debug mode is controlled by the DEBUG env var */
export const isDebug = env.DEBUG === true;
