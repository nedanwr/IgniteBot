# IgniteBot

A Discord bot with a web dashboard for guild management, built as a TypeScript monorepo.

## Project Structure

```
apps/
  bot/          # Discord.js bot
  dashboard/    # Next.js web dashboard
packages/
  convex/       # Shared Convex backend (database, auth, API)
```

## Tech Stack

- **Monorepo**: Turbo + pnpm workspaces
- **Bot**: Discord.js 14, Effect (functional error handling)
- **Dashboard**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex (serverless database + real-time sync)
- **Auth**: Convex Auth with Discord OAuth
- **Monitoring**: Sentry

## Commands

```bash
# Development
pnpm dev              # Run all apps in dev mode
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm check-types      # Type check all packages
pnpm format           # Format with Prettier

# Per-app dev (from root)
pnpm --filter bot dev
pnpm --filter dashboard dev

# Convex
cd packages/convex && npx convex dev    # Run Convex dev server
cd packages/convex && npx convex deploy # Deploy to production
```

## Architecture

### Bot (`apps/bot/src`)

- `events/` - Discord event handlers (messageCreate, interactionCreate, guildCreate, etc.)
- `services/` - Core services (Logger with Effect, Config, Convex client)
- `managers/` - Plugin management system
- `structs/` - Base classes (BotClient extends discord.js Client)
- `lib/` - Utilities, error types, environment validation

### Dashboard (`apps/dashboard/src`)

- `app/` - Next.js App Router pages
  - `(main)/guild/[discordId]/` - Guild management routes
  - `(main)/guild/[discordId]/commands/` - Command CRUD
  - `(main)/guild/[discordId]/settings/` - Guild settings
  - `api/upload/` - S3 presigned URL generation
- `components/` - UI components (uses Radix UI primitives)

### Convex (`packages/convex/convex`)

- `schema.ts` - Database schema (users, guilds, commands, guildSettings)
- `commands.ts` - Command CRUD mutations/queries
- `guilds.ts` - Guild management
- `guildSettings.ts` - Guild prefix and settings
- `users.ts` - User queries
- `auth.ts` - Discord OAuth configuration

## Database Schema

Key tables in Convex:

- **guilds** - Guild data, permissions, bot membership status
- **commands** - Custom commands per guild with responses array
- **guildSettings** - Per-guild settings (prefix, etc.)
- **users** - Auth users with Discord OAuth tokens

## Environment Variables

Bot requires:

- `DISCORD_TOKEN` - Bot token
- `CONVEX_URL` - Convex deployment URL

Dashboard requires:

- `CONVEX_URL` - Convex deployment URL
- `AWS_*` - S3 credentials for file uploads
- `SENTRY_*` - Sentry configuration

## Code Style

- Strict TypeScript with path aliases (`~/` maps to `src/`)
- Effect system for error handling in bot services
- Functional patterns preferred
- Prettier for formatting

## Testing

Run type checking before commits:

```bash
pnpm check-types
```
