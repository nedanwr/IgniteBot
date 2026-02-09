# @ignite-bot/convex

Shared Convex backend for IgniteBot — database schema, auth, and server functions.

## Setup

### Environment Variables

Set these via `npx convex env set <KEY> <VALUE>`:

| Variable | Description |
|----------|-------------|
| `AUTH_DISCORD_ID` | Discord OAuth client ID |
| `AUTH_DISCORD_SECRET` | Discord OAuth client secret |
| `BOT_SECRET` | Shared secret for bot-to-Convex API auth |
| `TOKEN_ENCRYPTION_KEY` | 256-bit hex key for encrypting OAuth tokens at rest |

### Generating the Encryption Key

```bash
openssl rand -hex 32
npx convex env set TOKEN_ENCRYPTION_KEY <output>
```

OAuth tokens (`accessToken`, `refreshToken`) are encrypted with AES-256-GCM before storage. Migration is automatic — existing plaintext tokens are encrypted on next use.

## Development

```bash
npx convex dev    # Run dev server (watches for changes, syncs schema)
npx convex deploy # Deploy to production
```
