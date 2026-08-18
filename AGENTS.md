# Neuland Connect - Agent Guide

Internal member portal for **Neuland Ingolstadt**. Read this before making architectural or integration changes.

## Product context

- **Users:** Vereinsmitglieder (members only - non-members cannot log in via Authentik)
- **Language:** UI copy is **German** (informal „du“, professional tone - avoid slang like „Drin“)
- **Branding:** Terminal-inspired Neuland CI (dark/light theme, `TerminalPanel`, corner accents, Noto Sans/Mono)
- **Live URLs:** `connect.neuland.ing` (prod), `http://localhost:3000` (dev)

## Non-negotiable architecture

1. **Authentik is the single source of truth** - no own user database, no local user tables
2. **User profile data** (name, email, username) is read from Authentik; changes are done via Vorstand, not in-app
3. **GitHub user OAuth** (`read:user` only) is for *linking* a member's GitHub identity - access tokens are **never persisted**
4. **Integration state** lives in **Authentik user attributes**, not in Connect's DB
5. **Modular integrations** under `src/lib/integrations/<name>/` - keep OAuth flows, API clients, and domain logic together
6. **Server-only secrets** in `src/lib/config.ts` (`serverConfig`) - never import into client components
7. **Sessions** via encrypted cookie (`src/lib/session.server.ts`), OIDC tokens stored for logout only

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | TanStack Start + Router + Query |
| UI | React 19, TypeScript, Tailwind v4, shadcn-style components |
| Runtime | Nitro (Docker in prod) |
| Auth | Authentik OIDC (PKCE) |
| Lint/format | Biome |

## Key directories

```
src/
  routes/                    # Pages + API routes (file-based)
    api/auth/                # OIDC login, callback, logout
    api/integrations/github/ # GitHub OAuth connect + callback
    api/integrations/discord/ # Discord OAuth connect + callback + linked-role
    dashboard.tsx            # Main member dashboard (auth required)
    login.tsx
  server/                    # createServerFn handlers (getCurrentUser, disconnectGitHub)
  lib/
    auth/                    # OIDC flow, crypto (PKCE)
    authentik/               # API client, attribute parsing, user resolution
    integrations/github/     # OAuth + integration progress logic
    integrations/discord/    # OAuth + guild role sync + Linked Roles
    session.server.ts        # Encrypted session (server-only)
  components/
    dashboard/               # GitHub/Discord cards, action banner, progress bars
    layout/                  # AppHeader, PageShell, theme toggle
    ui/                      # Button, Badge, TerminalPanel, etc.
```

**Import alias:** `#/` maps to `src/`

## Authentik user attributes

Defined in `src/lib/constants.ts` → `AUTHENTIK_ATTRIBUTES`:

| Attribute | Purpose | Status |
|-----------|---------|--------|
| `github_username` | Linked GitHub login | ✅ implemented |
| `github_id` | Linked GitHub numeric ID | ✅ implemented |
| `github_connected_at` | ISO timestamp of link | ✅ implemented |
| `github_org_status` | `invited` \| `member` | 🔜 prepared, not written yet |
| `discord_username` | Linked Discord login | ✅ implemented |
| `discord_id` | Linked Discord snowflake ID | ✅ implemented |
| `discord_connected_at` | ISO timestamp of link | ✅ implemented |
| `discord_guild_status` | `member` when in guild | ✅ implemented |
| `discord_role` (group attr) | Discord role snowflake for role sync | ✅ implemented |

Parse via `parseUserAttributes()` in `src/lib/authentik/types.ts`.

**User resolution:** OIDC `sub` may not equal Authentik API user PK. `resolveAuthentikUser()` falls back by email/username; `authentikUserId` is cached in session at login.

## Dashboard setup UX

- **Action banner** (`DashboardActionBanner`) – appears only when something needs attention (GitHub/Discord connect, org invite, guild join); hidden when complete
- **Per-integration progress** – dot indicator + fraction in panel title row (`IntegrationProgressInline`); hint in card subtitle when incomplete
- GitHub steps: Verbunden → Eingeladen → Org-Zugang
- Discord steps: Verbunden → Server → Rollen (Rollen step only when role sync enabled)

## GitHub integration (current)

- **OAuth App** (not GitHub App) for member-facing connect flow
- Routes: `GET /api/integrations/github/connect`, `GET /api/integrations/github/callback`
- Implementation: `src/lib/integrations/github/oauth.ts`
- On success: PATCH Authentik user attributes via `updateAuthentikUserAttributes()`
- Disconnect: `disconnectGitHubFn` clears GitHub attributes

## Discord integration

- **OAuth App** (`identify` + `guilds.join` + `role_connections.write`) for linking – tokens are discarded after callback (used for `/users/@me`, guild join, Linked Role metadata)
- **Bot** on the Neuland guild for guild join (PUT member with user token) and role assignment
- Routes: `GET /api/integrations/discord/connect`, `GET /api/integrations/discord/callback`, `GET /api/integrations/discord/linked-role` (Developer Portal verification URL)
- Implementation: `src/lib/integrations/discord/`
- Member flow: link account → auto-join guild on callback → bot syncs roles from Authentik groups with `discord_role` → write Linked Role metadata (non-blocking)
- Cron: `POST /api/internal/discord-roles/sync` (Bearer `CRON_SECRET`); metadata register: `POST /api/internal/discord-linked-roles/register`
- Disconnect: `disconnectDiscordFn` clears Discord attributes and strips guild roles (no kick; Linked Role in Discord is left in place)

See `docs/discord-guild-sync.md` for ops details.

## Future plan: GitHub Org invitations (GitHub App)

**Goal:** Automatically invite linked members to the Neuland GitHub organization and track status in Authentik.

### Why a separate GitHub App (not the user OAuth token)

- Member OAuth only has `read:user` and tokens are discarded after linking
- Org invites require **`members: write`** (or admin) on the organization
- A **GitHub App** installed on the org is the correct credential model (least privilege, rotatable, auditable)

### Planned architecture (event + reconciler)

```
GitHub OAuth callback success
        │
        ▼
enqueueOrgInvite(authentikUserId)     ← fire-and-forget, non-blocking
        │
        ├─ GET /orgs/{org}/members/{username}  → already member? set status=member
        ├─ POST /orgs/{org}/invitations        → set status=invited
        └─ on failure                          → status pending retry + log error
        │
        ▼
Cron / K8s CronJob (every 15–60 min)
        │
        └─ reconcile all users with github linked but status != member
```

**Implementation location (preferred):** stay inside Connect - no separate microservice initially.

- `src/lib/integrations/github/org.ts` - GitHub App auth (installation token), invite, membership check
- `src/lib/integrations/github/sync.ts` - reconcile logic (idempotent)
- `POST /api/internal/github-org/sync` - protected by `CRON_SECRET` header, called by CronJob

### New env vars (planned)

| Variable | Purpose |
|----------|---------|
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | PEM private key (or path) |
| `GITHUB_APP_INSTALLATION_ID` | Org installation ID |
| `GITHUB_ORG` | Org slug (e.g. `neuland-ingolstadt`) |
| `CRON_SECRET` | Bearer token for internal sync endpoint |

Keep existing `GITHUB_CLIENT_ID/SECRET` for member OAuth linking.

### Authentik attributes to write

| Attribute | Values |
|-----------|--------|
| `github_org_status` | `invited`, `member` (already in constants) |
| `github_org_invited_at` | ISO timestamp (add when implementing) |
| `github_org_last_error` | optional, for support/debug (add when implementing) |

### Implementation rules

- **Idempotent:** always check membership before inviting
- **Never store** GitHub App installation tokens long-term - generate per request
- **Do not block** the OAuth callback on invite failure - update status async
- **Dashboard** already reads `github_org_status` - wire up writes when backend lands
- **Disconnect policy:** decide explicitly whether disconnect removes org membership (default: don't auto-remove unless requested)

### GitHub API endpoints

```http
GET  /orgs/{org}/members/{username}     # 204 = member, 404 = not
POST /orgs/{org}/invitations            # body: { "invitee_id": <github_id> }
GET  /orgs/{org}/invitations            # optional: reconcile pending invites
```

## UI conventions

- **Layout width:** `max-w-5xl` for main content and header
- **Navbar:** `bg-terminal-nav` (distinct from page `terminal-bg`)
- **Panels:** `TerminalPanel` with `// title` header style
- **GitHub icon:** monochrome (`text-terminal-text`), never green/cyan
- **Theme:** `neuland-theme` localStorage key (shared with neuland website)
- **Legal links:** external to `neuland-ingolstadt.de` (Impressum, Datenschutz)

## Commands

```bash
bun run dev      # port 3000
bun run build
bun run start    # production
bun run docker:up
```

## What to avoid

- Adding a database for users or integration state
- Storing GitHub OAuth access tokens
- Checking Authentik member roles in-app (login gate is sufficient)
- English UI strings on user-facing pages
- Over-long copy on dashboard - prefer compact layout (progress bar + action cards)
- Importing `*.server.ts` modules from client code (TanStack import protection)
- Committing `.env` or secrets

## When adding a new integration

1. Create `src/lib/integrations/<name>/` with oauth/api modules
2. Add API routes under `src/routes/api/integrations/<name>/`
3. Add Authentik attribute keys to `AUTHENTIK_ATTRIBUTES` in constants
4. Extend `parseUserAttributes()` and dashboard UI as needed
5. Document new env vars in `.env.example` and README

---

<!-- intent-skills:start -->
# TanStack Intent - before editing files, run the matching guidance command.
tanstackIntent:
  - id: "@tanstack/devtools#devtools-app-setup"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-app-setup"
    for: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
  - id: "@tanstack/devtools#devtools-marketplace"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-marketplace"
    for: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
  - id: "@tanstack/devtools#devtools-plugin-panel"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-plugin-panel"
    for: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
  - id: "@tanstack/devtools#devtools-production"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-production"
    for: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
  - id: "@tanstack/devtools-event-client#devtools-bidirectional"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-bidirectional"
    for: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
  - id: "@tanstack/devtools-event-client#devtools-event-client"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-event-client"
    for: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
  - id: "@tanstack/devtools-event-client#devtools-instrumentation"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-instrumentation"
    for: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
  - id: "@tanstack/devtools-vite#devtools-vite-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-vite#devtools-vite-plugin"
    for: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
  - id: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#lifecycle/migrate-from-nextjs"
    for: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
  - id: "@tanstack/react-start#react-start"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start"
    for: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
  - id: "@tanstack/react-start#react-start/server-components"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start/server-components"
    for: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
  - id: "@tanstack/router-core#router-core"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core"
    for: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
  - id: "@tanstack/router-core#router-core/auth-and-guards"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/auth-and-guards"
    for: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
  - id: "@tanstack/router-core#router-core/code-splitting"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/code-splitting"
    for: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
  - id: "@tanstack/router-core#router-core/data-loading"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/data-loading"
    for: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
  - id: "@tanstack/router-core#router-core/navigation"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/navigation"
    for: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
  - id: "@tanstack/router-core#router-core/not-found-and-errors"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/not-found-and-errors"
    for: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
  - id: "@tanstack/router-core#router-core/path-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/path-params"
    for: "Dynamic path segments ($paramName), splat routes ($ / _splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
  - id: "@tanstack/router-core#router-core/search-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params"
    for: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
  - id: "@tanstack/router-core#router-core/ssr"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/ssr"
    for: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
  - id: "@tanstack/router-core#router-core/type-safety"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/type-safety"
    for: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
  - id: "@tanstack/router-plugin#router-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/router-plugin#router-plugin"
    for: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
  - id: "@tanstack/start-client-core#start-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core"
    for: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
  - id: "@tanstack/start-client-core#start-core/auth-server-primitives"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/auth-server-primitives"
    for: "Server-side authentication primitives for TanStack Start: session cookies (HttpOnly, Secure, SameSite, __Host- prefix), session read/issue/destroy via createServerFn and middleware, OAuth authorization-code flow with state and PKCE, password-reset enumeration defense, CSRF for non-GET RPCs, rate limiting auth endpoints, session rotation on privilege change. Pairs with router-core/auth-and-guards for the routing side."
  - id: "@tanstack/start-client-core#start-core/deployment"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment"
    for: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
  - id: "@tanstack/start-client-core#start-core/execution-model"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/execution-model"
    for: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE_ prefix, process.env)."
  - id: "@tanstack/start-client-core#start-core/middleware"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/middleware"
    for: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
  - id: "@tanstack/start-client-core#start-core/server-functions"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions"
    for: "createServerFn (GET/POST), validator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
  - id: "@tanstack/start-client-core#start-core/server-routes"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-routes"
    for: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
  - id: "@tanstack/start-server-core#start-server-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-server-core#start-server-core"
    for: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
  - id: "@tanstack/virtual-file-routes#virtual-file-routes"
    run: "npx @tanstack/intent@latest load @tanstack/virtual-file-routes#virtual-file-routes"
    for: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
<!-- intent-skills:end -->
