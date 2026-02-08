# IgniteBot

Discord bot for guild management, built with Discord.js 14 and Effect.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLIENT_TOKEN` | Discord bot token |
| `CLIENT_OWNER_ID` | Discord user ID of the bot owner |
| `CONVEX_URL` | Convex deployment URL |
| `BOT_SECRET` | Shared secret for authenticated Convex HTTP endpoints. Must match the `BOT_SECRET` set in Convex dashboard env vars. Generate with `openssl rand -hex 32`. |
| `DEBUG` | Optional. Enable debug logging (`true`/`false`) |
| `DEV_GUILD_ID` | Optional. Discord guild ID for development |

## Setup

1. Copy `.env.example` to `.env` (or create `.env` manually)
2. Fill in all required environment variables
3. Set the same `BOT_SECRET` value in your Convex deployment's environment variables

## Development

```bash
pnpm dev
```

## Production

```bash
pnpm build && pnpm start
```
