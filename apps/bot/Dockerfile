FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

# Copy workspace config and lockfile first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/bot/package.json ./apps/bot/
COPY packages/convex/package.json ./packages/convex/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source files
COPY apps/bot/ ./apps/bot/
COPY packages/convex/ ./packages/convex/

# Build TypeScript
RUN pnpm --filter @ignite-bot/bot build

# Create standalone production deployment
RUN pnpm --filter @ignite-bot/bot deploy --prod /prod/bot

FROM node:22-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /prod/bot/node_modules ./node_modules
COPY --from=build /prod/bot/package.json ./
COPY --from=build /app/apps/bot/dist ./dist

# tsx is needed at runtime for path alias resolution
RUN npm install --no-save tsx

# Required at runtime:
#   CLIENT_TOKEN    - Discord bot token
#   CLIENT_OWNER_ID - Discord user ID of the bot owner
#   CONVEX_URL      - Convex deployment URL
#   BOT_SECRET      - Bot secret key
# Optional:
#   DEBUG           - Enable debug logging (true/false)
#   DEV_GUILD_ID    - Development guild ID

CMD ["node", "--import", "tsx", "dist/index.js"]
