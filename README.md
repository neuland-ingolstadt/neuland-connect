# Neuland Connect

[![CI](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/ci.yml/badge.svg)](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/ci.yml)
[![CodeQL](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/codeql.yml/badge.svg)](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/codeql.yml)
[![Docker](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/build-docker.yml/badge.svg)](https://github.com/neuland-ingolstadt/neuland-connect/actions/workflows/build-docker.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fconnect.neuland.ing&label=connect.neuland.ing)](https://connect.neuland.ing)
[![Bun](https://img.shields.io/badge/Bun-1.3.14-black?logo=bun&logoColor=white)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-latest-FF4154?logo=react&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Biome](https://img.shields.io/badge/Biome-enabled-60a5fa)](https://biomejs.dev)
[![Renovate](https://img.shields.io/badge/Renovate-enabled-1A1F6C?logo=renovatebot&logoColor=white)](https://github.com/renovatebot/renovate)
[![REUSE status](https://api.reuse.software/badge/github.com/neuland-ingolstadt/neuland-connect)](https://api.reuse.software/info/github.com/neuland-ingolstadt/neuland-connect)

Member portal for **[Neuland Ingolstadt](https://neuland-ingolstadt.de)**. Members sign in with Authentik, link their GitHub account from a dashboard, and track org onboarding progress - without Connect maintaining its own user database.

**Production:** [connect.neuland.ing](https://connect.neuland.ing) · **Local dev:** [localhost:3000](http://localhost:3000)

> The member-facing UI is **German** (informal *du*). This README is in English for contributors and operators.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Authentik setup](#authentik-setup)
- [GitHub integration](#github-integration)
- [Docker](#docker)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Licensing](#licensing)

## Features

- **Authentik OIDC** - PKCE login; only Vereinsmitglieder can authenticate
- **Member dashboard** - profile overview, GitHub connection card, four-step onboarding progress
- **GitHub account linking** - OAuth App with `read:user` scope; connect, reconnect, and disconnect
- **GitHub org onboarding** - optional GitHub App for org invites and membership sync
- **Discord account linking** - OAuth with guild join, role sync, and Linked Roles (tokens discarded)
- **Integration state in Authentik** - user attributes, not a local DB
- **Terminal-inspired UI** - Neuland CI, dark/light theme

## Architecture

```
Member browser
      │
      ▼
  Connect (TanStack Start + Nitro)
      │
      ├── Authentik OIDC ──► session cookie (encrypted)
      ├── Authentik API  ──► read/write user attributes
      └── GitHub OAuth   ──► link identity (token discarded after use)

Optional: GitHub App ──► org invites + membership reconciliation
```

**Design rules**

| Principle | Implementation |
|-----------|----------------|
| Single source of truth for users | Authentik only - no user tables in Connect |
| Integration state | Authentik user attributes (`github_username`, `github_org_status`, …) |
| GitHub member OAuth | `read:user` only; access tokens are never persisted |
| Org management | Separate GitHub App with `members: write` on the organization |
| Secrets | Server-only via `src/lib/config.ts` - never imported in client code |

See [AGENTS.md](./AGENTS.md) for agent/contributor conventions and [docs/github-org-sync.md](./docs/github-org-sync.md) for org-sync details.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [TanStack Start](https://tanstack.com/start) + Router + Query |
| UI | React 19, TypeScript, Tailwind CSS v4, shadcn-style components |
| Runtime | [Bun](https://bun.sh) (dev/CI); Nitro build output on Node-compatible runtime |
| Auth | Authentik OIDC (PKCE) |
| Lint / format | [Biome](https://biomejs.dev) |
| Container | Docker (`oven/bun` multi-stage) |
| Dependencies | [Mend Renovate](https://www.mend.io/renovate/) with grouped updates |

The Bun version is defined in [`.bun-version`](./.bun-version). CI, Docker builds, and `packageManager` in `package.json` follow that file (updated by Renovate).

## Getting started

### Prerequisites

- [Bun](https://bun.sh) - version from `.bun-version` (or use `bun upgrade` after cloning)
- Authentik instance with a Connect OIDC application
- GitHub OAuth App (for account linking)

### Install and run

```bash
git clone https://github.com/neuland-ingolstadt/neuland-connect.git
cd neuland-connect

cp .env.example .env
# Fill in real values (see below)

bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quality checks

```bash
bun run typecheck   # TypeScript
bun run check       # Biome lint + format
bun run build       # Production build
```

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` (or `.env.local` for Vite). Docker Compose reads `.env` by default.

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `SESSION_SECRET` | Yes | Min. 32 characters for encrypted session cookies |
| `AUTHENTIK_ISSUER` | Yes | OIDC issuer URL of the Authentik application |
| `AUTHENTIK_CLIENT_ID` | Yes | OIDC client ID |
| `AUTHENTIK_CLIENT_SECRET` | Yes | OIDC client secret |
| `AUTHENTIK_API_URL` | Yes | Authentik base URL |
| `AUTHENTIK_API_TOKEN` | Yes | API token with user read/write permissions |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `GITHUB_APP_ID` | Org sync | GitHub App ID for org invitations |
| `GITHUB_APP_PRIVATE_KEY` | Org sync | PEM private key (single line with `\n` is fine) |
| `GITHUB_APP_INSTALLATION_ID` | Org sync | App installation ID on the organization |
| `GITHUB_ORG` | Org sync | Organization slug (e.g. `neuland-ingolstadt`) |
| `CRON_SECRET` | Org/team/Discord sync | Bearer token for internal cron endpoints |
| `DISCORD_CLIENT_ID` | Discord | Discord OAuth App client ID |
| `DISCORD_CLIENT_SECRET` | Discord | Discord OAuth App client secret |
| `DISCORD_BOT_TOKEN` | Discord | Bot token (guild join, role sync, Linked Roles metadata) |
| `DISCORD_GUILD_ID` | Discord | Neuland guild snowflake |

## Authentik setup

1. Create an **OIDC provider / application** with redirect URI:
   ```
   {APP_URL}/api/auth/callback
   ```
2. Create an **API token** with permission to read and update users.
3. Ensure these user attributes exist (or can be written) on member accounts:

   | Attribute | Purpose |
   |-----------|---------|
   | `github_username` | Linked GitHub login |
   | `github_id` | Linked GitHub numeric ID |
   | `github_connected_at` | ISO timestamp of link |
   | `github_org_status` | `invited` or `member` |
   | `github_org_invited_at` | Optional - invite timestamp |
   | `github_org_last_error` | Optional - support/debug |

Profile changes (name, email) are handled by the Vorstand in Authentik, not in Connect.

## GitHub integration

Connect uses **two separate GitHub credentials**:

| Credential | Used by | Permission |
|------------|---------|------------|
| **OAuth App** | Members linking their account | `read:user` |
| **GitHub App** | Server-side org invites, team sync | Members + Team memberships: read & write |

The OAuth App alone cannot invite users to an organization.

### OAuth App (account linking)

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. **Authorization callback URL:** `{APP_URL}/api/integrations/github/callback`
3. Requested scope: `read:user`

### GitHub App (org invitations) - optional

Required only if you enable automatic org onboarding.

1. **Create app** - GitHub → **Developer settings** → **GitHub Apps** → **New GitHub App**
   - Homepage: `https://connect.neuland.ing` (or your dev URL)
   - Webhook: disabled
   - Organization permission **Members**: Read and write
   - Organization permission **Team memberships**: Read and write (for team sync)
   - Install only on account: `neuland-ingolstadt`
2. **Generate a private key** and set `GITHUB_APP_PRIVATE_KEY` in `.env`
3. **Install** the app on the organization and note:
   - `GITHUB_APP_ID` - on the app page
   - `GITHUB_APP_INSTALLATION_ID` - from the installation URL or `GET /app/installations`
4. Set `GITHUB_ORG` and `CRON_SECRET`

```env
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=98765432
GITHUB_ORG=neuland-ingolstadt
CRON_SECRET=your-long-random-secret
```

**Flow**

1. Member links GitHub → Connect enqueues an org invite in the background (non-blocking).
2. Authentik `github_org_status` is set to `invited` or `member`.
3. A cron job calls the reconcile endpoints periodically:

```bash
curl -X POST https://connect.neuland.ing/api/internal/github-org/sync \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST https://connect.neuland.ing/api/internal/github-teams/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

### GitHub team sync (Authentik groups)

Stateless full reconcile of GitHub teams from Authentik:

1. Create Authentik groups (any name) and set group attribute:

```json
{ "github_team": "kubernetes" }
```

2. Put users in those groups. Cron or dashboard „Teams synchronisieren“ adds/removes only groups that have `github_team` set.

Full behaviour, edge cases, and dashboard steps: [docs/github-org-sync.md](./docs/github-org-sync.md).

## Discord integration

Connect uses an **OAuth App** (member linking + Linked Roles) and a **bot** (guild join, role assignment). Access tokens are discarded after the callback.

**Linked Roles** work with this custom app (not only YouTube / League). The app appears under **Server Settings → Roles → Links** only after:

1. Bot is in the guild
2. Developer Portal **Linked Roles Verification URL** = `{APP_URL}/api/integrations/discord/linked-role`
3. Metadata schema registered (`POST /api/internal/discord-linked-roles/register` or first successful connect)

Ops details: [docs/discord-guild-sync.md](./docs/discord-guild-sync.md).

## Docker

```bash
cp .env.example .env
# configure .env

bun run docker:up      # recommended - reads .bun-version automatically
# or
bun run docker:build   # build image only
```

The image is built with `BUN_VERSION` from `.bun-version`. Production images are also published to `ghcr.io` on pushes to `main`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server on port 3000 |
| `bun run build` | Production build (Nitro output in `.output/`) |
| `bun run start` | Run production server |
| `bun run generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `bun run check` | Biome lint + format check |
| `bun run check:fix` | Biome auto-fix |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run docker:up` | `docker compose up --build` with Bun version from file |
| `bun run docker:build` | `docker build` with Bun version from file |

## Project structure

```
src/
  components/       # UI (dashboard, layout, shadcn-style primitives)
  lib/
    authentik/      # API client, attribute parsing
    auth/           # OIDC flow, PKCE
    integrations/   # GitHub OAuth, org sync, onboarding status
  routes/           # Pages and API routes (file-based)
  server/           # createServerFn handlers
```

Import alias: `#/` → `src/` (see `package.json` `imports`).

## Contributing

1. Branch from `main`, keep changes focused.
2. Run `bun run typecheck` and `bun run check` before opening a PR.
3. Do not commit `.env`, `.env.local`, or secrets.
4. User-facing copy stays **German**; code comments and docs can be English.

Dependency updates are automated via Renovate (`renovate.json`) with grouped PRs for production, dev, Docker, Actions, Biome, and Bun.

## Licensing

This project is licensed under [AGPL-3.0-only](LICENSES/AGPL-3.0-only.txt). Copyright © 2026 Robert Eggl and Neuland Ingolstadt.

Licensing metadata is managed with [REUSE](https://reuse.software/) via [`REUSE.toml`](./REUSE.toml). Compliance is tracked by the [REUSE API](https://api.reuse.software/info/github.com/neuland-ingolstadt/neuland-connect).

---

**Neuland Ingolstadt** · [Website](https://neuland-ingolstadt.de) · [Impressum](https://neuland-ingolstadt.de/legal/impressum) · [Datenschutz](https://neuland-ingolstadt.de/legal/datenschutz)
