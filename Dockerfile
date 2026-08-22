# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32

ARG BUN_VERSION
FROM oven/bun:${BUN_VERSION}-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
ARG VITE_BUILD_COMMIT=dev
ENV VITE_BUILD_COMMIT=$VITE_BUILD_COMMIT
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run generate-routes && bun run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Runtime configuration - set via env_file, -e, or your orchestrator at deploy time.
ENV APP_URL=""
ENV SESSION_SECRET=""
ENV AUTHENTIK_ISSUER=""
ENV AUTHENTIK_CLIENT_ID=""
ENV AUTHENTIK_CLIENT_SECRET=""
ENV AUTHENTIK_API_URL=""
ENV AUTHENTIK_API_TOKEN=""
ENV GITHUB_CLIENT_ID=""
ENV GITHUB_CLIENT_SECRET=""
ENV GITHUB_APP_ID=""
ENV GITHUB_APP_PRIVATE_KEY=""
ENV GITHUB_APP_INSTALLATION_ID=""
ENV GITHUB_ORG=""
ENV CRON_SECRET=""

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=build --chown=nodejs:nodejs /app/.output ./.output
COPY --from=build /app/package.json ./package.json

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

CMD ["bun", ".output/server/index.mjs"]
