# Software Factory — Work Stream Breakdown (revised for plan v5)

**Status:** Planning draft, not an authorization to start implementation. See the accompanying v5 plan for evidence, trust boundaries, and unresolved decisions. The original v4 plan remains unchanged.

Repo state: `ataylorme/software-factory` is empty (README + .gitignore). Everything is greenfield.

## Guiding principle: contract-first, then fan out
Most parallel conflict risk comes from shared types (session context, roles, SDLC states, MCP tool names, Cedar entities) and shared config (`wrangler.jsonc`, root `package.json`). A short **Wave 0** pins the monorepo layout and a `packages/contracts` package so every later stream codes against stable interfaces in its own directory.

## TanStack ecosystem: recommended adoption

These are recommendations, not new independent work streams. Pin and verify compatible package versions when implementing; `latest` documentation can describe newer APIs.

| Library | Recommendation and intended use | Assigned stream |
|---|---|---|
| [Router](https://tanstack.com/router/latest/docs/framework/react/overview) | Use Start's router for typed routes and validated search parameters for session, repository, and audit filters. Route guards improve UX, but **do not replace server-side authorization**. | WS2, WS6, WS10 |
| [Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query) | Recommended for issue/PR lists, project state and dashboard reads, pagination, freshness, and mutation invalidation. Coordinate loaders and queries without duplicating cache ownership. GitHub webhooks/workflows remain the event source. | WS2, WS6, WS7, WS10 |
| [Form](https://tanstack.com/form/latest/docs/overview) | Use for nontrivial configuration and approval forms where typed validation and submission state help. Validate and authorize again on the server. | WS2, WS7, WS10 |
| [Table](https://tanstack.com/table/latest/docs/overview) | Keep for audit and spend tables; it is headless, so accessible markup and controls remain our responsibility. Use server-side filtering and pagination for large datasets. | WS10 |
| [Virtual](https://tanstack.com/virtual/latest/docs/introduction) | Add only where long logs or evidence lists make rendering slow. Virtualization does not replace server pagination. | WS6, optionally WS10 |
| [Markdown](https://tanstack.com/markdown/latest/docs/core-concepts/security) and [Highlight](https://tanstack.com/highlight/latest/llms.txt) | Evaluate for agent reports and code blocks; keep raw HTML disabled for untrusted content, bound document sizes, and validate renderer, extension and highlighter security. | WS6 |
| [Charts](https://tanstack.com/charts/latest/docs/stability) | Optional for spend visualizations; its documented pre-1.0 API is alpha. Use a table first and evaluate only if charts add value. | WS10 |
| [DB](https://tanstack.com/db/latest/docs/overview) | **Required:** scoped project, issue/PR and agent-run collections, Query-backed loading and `useLiveQuery` views. Its site currently labels it beta; pin a compatible version. It is a **client-side** layer, not a replacement for D1, Durable Object storage, or a synchronization service. | WS2 foundation; WS6 implementation |
| [Pacer](https://tanstack.com/pacer/latest/docs/overview), [Hotkeys](https://tanstack.com/hotkeys/latest/docs/overview), [Store](https://tanstack.com/store/latest/docs/overview), [Devtools](https://tanstack.com/devtools/latest/docs/overview) | Optional: Pacer for measured UI debounce/batching, Hotkeys for future keyboard workflows, Store if local state needs it, and Devtools for development. Pacer and Hotkeys are documented as beta; Devtools as alpha. None replaces server-side rate limits, authorization, or durable queues. | Relevant UI owner; defer by default |
| [Intent](https://tanstack.com/intent/latest/docs/concepts/trust-model) | Evaluate for versioned package-supplied agent skills, not as a policy or security boundary. Its own docs require explicit source allowlists for controlled trust; review content changes on package upgrades. | WS0/WS8, optional |

Discovery source: [TanStack library index](https://tanstack.com/llms.txt). Redact, Config, and CLI are not required for the initial architecture; evaluate only if a specific need emerges.

**UI components (decided):** Use [shadcn/ui](https://ui.shadcn.com/docs/installation/tanstack) for shared dashboard primitives, styled forms and tables, and selective AI-oriented components. It complements TanStack Form/Table and adds Tailwind and copied component code we maintain and audit; verify accessibility and registry provenance. WS2 owns the initial UI conventions and components; other streams contribute through agreed component boundaries.

**Query security and behavior:** Create the QueryClient per server request/router, not at Worker module scope; use the documented Start SSR integration. Scope browser keys by relevant account, tenant, and resource, clear private queries on sign-out/account switch, and keep personalized responses `private, no-store`. Enforce authorization in every server function, route/API endpoint, and WebSocket upgrade; cache keys and client route guards are not access controls. Verify SSR request isolation, invalidation after mutations, and account-switch cleanup. Do not optimistically report approvals, privileged operations, or policy decisions as completed before the server confirms them.

**TanStack DB implementation (decided):** Use `@tanstack/react-db` and `@tanstack/query-db-collection` to load authorized, bounded session and project records and derive live filtered views. A Query collection refreshes from its query; it does not automatically subscribe to D1 or a Durable Object. For cross-user updates, implement an authorized agent event stream that invalidates/refetches affected queries or updates a collection through a supported API; define stable IDs, ordering, reconnect/replay, deduplication and snapshot reconciliation. Use request-scoped DbClient/QueryClient on SSR, tenant-scoped collection IDs and keys, and clear them on logout or scope change. Support non-privileged optimistic edits with rollback; never mark an approval, policy decision, push or deployment successful before server confirmation. Acceptance: two clients converge after an edit and reconnect, failed writes roll back, and account/tenant isolation holds. Pin versions and test beta upgrades as normal dependency maintenance. [Query collection](https://tanstack.com/db/latest/docs/collections/query-collection) · [SSR](https://tanstack.com/db/latest/docs/guides/ssr) · [Mutations](https://tanstack.com/db/latest/docs/guides/mutations).

## Proposed monorepo layout
```
apps/control-plane/        TanStack Start on Workers (UI + server fns + DO classes)
apps/mcp-policy-gateway/   Cedar WASM policy Worker (prod + staging deployments)
apps/factory-workflows/    Cloudflare Workflows Worker for the SDLC pipeline (prod + staging)
infra/tofu/                OpenTofu (base infra, envs: staging, prod, pr-ephemeral module)
packages/contracts/        Zod schemas + TS types (roles, personas, SDLC states, tool names, context)
packages/db/               Analytics D1 schema, Drizzle migrations and client
packages/auth-db/          Better Auth Drizzle schema + migrations (separate auth D1)
packages/state/            Project-state API and workflow_registry loader
packages/ai/               Model gateway adapters, metadata and usage integration
packages/sandbox-tools/    Sandbox + Dynamic Worker MCP tool implementations
policies/                  *.cedar + Cedar schema + policy tests
.github/workflows/         CI, tofu plan/apply, wrangler deploy/preview
```

---

## Worker Previews integration (per developers.cloudflare.com/workers/previews)
The plan uses Previews, but its sample `wrangler.jsonc` and assumptions conflict with documented behavior. Design rules every stream must follow:

| Doc behavior                                                                                | Impact on the plan                                                                  | Rule                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Previews **don't inherit** most production settings; `previews` block required              | Required bindings may be absent and cause runtime failures                          | WS2 owns a complete Preview config; check the bindings actually required by preview code, not indiscriminate parity with production.                                                                                                                                                                            |
| DOs/Containers auto-isolated per Preview; `env` bindings must be redeclared                 | `USER_AGENT`/`REPO_AGENT` env bindings would be missing                             | Prefer `ctx.exports` (compat date ≥ 2025-11-17); else redeclare in `previews.durable_objects`. Sandbox containers go in `previews.containers` too.                                                                                                                                                              |
| **Service bindings call the bound Worker's production deployment**                          | Preview control plane → **prod** MCP Policy Gateway (prod policies, prod audit log) | All previews bind to a separate staging gateway, never production.                                                                                                                                                                                                                                              |
| **Workflows bindings use existing Workflow code**; no per-preview Workflows                 | SDLC workflow changes can't be tested in a branch preview                           | Host SDLC Workflows in a staging Worker (`factory-workflows-staging`) bound in previews; workflow code changes validated via staging deploy, not previews.                                                                                                                                                      |
| Queue consumers, Cron Triggers, routes never target Previews                                | Async usage logging / budget jobs won't run in previews                             | Previews bind producers to a staging queue; consumers run in staging only.                                                                                                                                                                                                                                      |
| Secrets via `wrangler preview base-config secret put`                                       | Base secrets can be inherited by new Previews                                       | Initial previews are for trusted collaborators in the private repository only; keep production credentials out of preview config and use staging auth/services. Fork PR previews are out of scope.                                                                                                              |
| D1 migrations must be applied to the preview's DB **before** deploy                         | Tier 1 shares staging D1 — a branch migration mutates shared staging                | Schema-changing PRs use isolated test databases; never bind production auth data to previews.                                                                                                                                                                                                                   |
| Preview URLs public by default; custom domains need Access                                  | Already planned                                                                     | Access on all previews of this Worker; QA agents use Access service tokens.                                                                                                                                                                                                                                     |
| Preview limits vary by plan (100 Free / 500 Paid); container apps may remain after deletion | Needs cleanup                                                                       | PR-close cleanup must verify exact owned resources before deletion, account for failures and use scoped IaC state.                                                                                                                                                                                              |
| Branch-scoped observability                                                                 | Fits QA self-heal loop                                                              | QA agent queries preview-scoped logs/traces via MCP.                                                                                                                                                                                                                                                            |
| **Better Auth on dynamic preview hostnames**                                                | GitHub OAuth requires an appropriate registered callback                            | Use Better Auth `oAuthProxy` only for trusted collaborator previews, with a staging auth database. Its shared secret can assert identities in participating deployments; never use it with production auth data. Fork PR previews are out of scope. [Source](https://better-auth.com/docs/plugins/oauth-proxy). |

## Wave 0 — Foundation (1 session, blocks everything)
**WS0 · Monorepo scaffold & contracts**
- pnpm workspaces + Turborepo, TS strict base config, Biome (lint + format; no ESLint/Prettier), Vitest, CI lint/typecheck/test.
- `packages/contracts`: `Role`, `Persona`, `SdlcState` + transitions, `McpToolName`, `SessionScope`, `SessionContext` (userId, teamId, repo, persona, sdlcState), `WorkflowRegistry` Zod schema, Env binding interface names.
- Skeleton dirs/package.json for every package/app above (empty exports) so later streams don't touch root config.
- ADR folder seeded from plan §2.
- **Exit:** `pnpm i && pnpm typecheck && pnpm test` green in CI.

## Wave 1 — Independent pillars (5 parallel sessions)
**WS1 · Infrastructure as Code (OpenTofu)** — `infra/tofu/`
- Provider `cloudflare/cloudflare` v5; R2 backend for state (document bootstrap: state bucket created manually/once).
- Implement the required Cloudflare resources with provider-schema checks; configure and exercise R2/OpenTofu state locking under concurrent applies. Protect state and scope deployment credentials.
- Modules: Zero Trust Access apps/policies for **preview hostnames and admin only** (+ service tokens for QA agents/CI), D1 × 2 per env — `factory-analytics-<env>` and a separate `factory-auth-<env>` (Better Auth only), R2 (artifacts), KV (Better Auth secondary storage / rate limits), Queues, AI Gateway (BYOK, rate limit, caching, guardrails where provider supports), DNS/WAF, scoped API tokens.
- Envs: `staging`, `prod`; reusable `pr-ephemeral` module for isolated analytics/auth D1 and, when needed, an isolated R2 bucket. A key prefix alone is not an access boundary for a bucket binding.
- Staging-only resources for Previews: staging queue, custom preview domain (e.g. `*.preview.<domain>`), Access app covering all Previews of the control-plane Worker + service tokens.
- Outputs → script that renders IDs into `wrangler.jsonc` (no hand-copied IDs).
- CI: `tofu fmt/validate/plan` on PR, gated `apply` on main.
- **Exit:** `tofu plan` clean for staging; outputs consumed by wrangler render script.

**WS2 · TanStack Start control plane + Identity** — `apps/control-plane/`
- TanStack Start + React 19 + `@cloudflare/vite-plugin`, Wrangler ≥ 4.135.0 as a project dependency, `wrangler.jsonc` (IDs templated) with a **complete `previews` block** per the Previews rules above, plus CI checks for bindings required by preview code. Typed `Env`.
- Verify `wrangler preview` works with the TanStack Start/Vite build output (smoke preview in CI).
- Router shell: GitHub-linked work queue, issue/PR run detail and status, admin placeholder.
- Set up shadcn/ui and Tailwind in the control plane; establish theme tokens and shared primitives for navigation, dialogs, forms and tables. Keep Biome as the lint/format tool.
- Integrate Router and Query per request for SSR; provide reusable query options, private cache lifecycle, and tests for cross-user isolation. Keep private reads and writes in authenticated server boundaries.
- Set up request-scoped TanStack DB clients, tenant-scoped collection factories and shared project/run record contracts for WS6.
- Auth (**decided: Better Auth**): Better Auth in the Worker backed by its **own D1 database** (`AUTH_DB` binding, separate from `ANALYTICS_DB`), using the Better Auth Drizzle adapter. Schema and migrations live in `packages/auth-db`. Keep production auth data out of previews.
- GitHub login is the proposed identity provider; use `account.encryptOAuthTokens` if retaining OAuth tokens, and keep encryption keys out of untrusted environments. Use short-lived GitHub App installation tokens for bot actions and the user's GitHub token only for actions explicitly taken on that user's behalf. For example, record an evidence approval with the user's token, then merge with the App token. Audit the acting principal and credential type separately; neither credential removes per-user repository authorization checks.
- Roles: organization + access-control plugins map users to `Role`/`Persona` from contracts; session → `SessionContext` helper consumed by DOs and the Cedar gateway.
- Repo-permission ACL helper (`GET /repos/{org}/{repo}`) using the stored GitHub token.
- Preview login: configure the trusted-collaborator OAuth proxy and staging auth data; fork PR previews are not supported in v1.
- Defense in depth: admin routes also verify `Cf-Access-Jwt-Assertion` (Access in front of admin hostname, provisioned by WS1).
- **Exit:** local `wrangler dev` login → protected route; ACL helper unit-tested with mocked GitHub.

**WS3 · Data & state layer** — `packages/db`, `packages/state`
- Analytics D1 schema and migrations with Drizzle. Do not rely on v4's outdated generator example.
- Implement per-project Durable Objects with SQLite and Drizzle's Durable SQLite driver as the authoritative serialized project-state store. Keep large artifacts in R2; test concurrent transitions, retries and recovery.
- `_platform/workflow_registry.json` seed + loader/validator (uses contracts schema); transition guard function.
- **Exit:** Workers-runtime tests for concurrent transitions, failure recovery and registry validation.

**WS4 · MCP Policy Gateway (Cedar)** — `apps/mcp-policy-gateway/`, `policies/`
- Standalone Worker exposing MCP `tools/call` proxy; use `@cedar-policy/cedar-wasm` and test Workers compatibility, bundle size and fail-closed behavior. Evaluate Access MCP portals only as optional coarse control, not a replacement for argument-level policy.
- Cedar schema + the 3 policies from §5.1; policies loaded from R2 with in-memory TTL cache; **fail-closed** on any error.
- Audit write to D1 `PolicyAuditLog` (via `packages/db`, or an interface stub if WS3 not merged yet).
- Policy unit test matrix (role × tool × sdlcState × branch).
- Deployed twice: `mcp-policy-gateway` (prod) and `mcp-policy-gateway-staging` (staging R2 policies + staging audit D1), since Preview service bindings always hit production deployments.
- **Exit:** service binding callable; ALLOW/DENY tests green; deny on missing/invalid policy.

**WS5 · AI Gateway + model adapters** — `packages/ai`
- Use TanStack AI with `@tanstack/ai-cloudflare` and the Worker `env.AI` binding for Workers AI and AI Gateway model/tool calls. This is the background-agent model/tool layer, not a chat UI or project-state store.
- Request metadata tagging (userId, repo, persona, sessionId); per-persona model routing config.
- Use AI Gateway spend limits plus usage monitoring and alerts initially; limits are estimated and eventually consistent, not strict hard caps. A strict reservation/reconciliation ledger is out of initial scope. Metadata is limited to five custom entries.
- **Exit:** unit tests with mocked gateway; one live smoke script behind env flag.

## Wave 2 — Integration (coordinate shared control-plane edits)
**WS6 · Agent runs and GitHub outcomes** — `packages/ai`, `packages/state`, control-plane integration
- Start background agent runs from authorized GitHub issue/PR events through the workflow API; keep run identity, repository, triggering actor and commit SHA explicit.
- Use the TanStack AI model/tool API. Keep run orchestration in Cloudflare Workflows and durable project state in per-project Durable Objects; don't make UI chat transport a prerequisite.
- Give each specialist agent (refinement, planning, development, QA, operations) a role-appropriate GitHub toolset through app-backed adapters or MCP, using GitHub App installation tokens for bot actions. Route tool calls through `MCP_GATEWAY`; render DENY as a policy block. A human approval must trigger a new policy evaluation; it must not automatically override an explicit deny.
- Post bounded progress, evidence and completion summaries to the originating issue/PR. Bind actions and approvals to the exact repository, PR head SHA, operation and user; ordinary free-form comments are feedback, not authorization.
- Implement TanStack DB collections for authorized issue/PR and project state using the Query-backed loading and event reconciliation contract above. Compose work-queue and run-detail views with shared shadcn/ui components. Add Virtual only if logs or evidence lists warrant it.
- Depends: WS2, WS4, WS5.

**WS7 · SDLC Workflows** — `apps/factory-workflows/` (separate Worker)
- Workflows live in their own Worker deployed to prod + staging; control plane binds by name (previews → staging), since Previews can't create per-branch Workflows.
- `BA → SA → Dev → QA → DevOps` workflow with `waitForEvent` human approval steps 1–4, transitions through the selected state authority, and construction briefs in R2.
- Receive GitHub review/approval webhooks to resume gated steps; validate sender permissions and bind the event to the expected repository, PR head SHA, workflow run and requested operation.
- The control plane may show approval state, but GitHub is the initial human interaction surface. Reconcile TanStack DB project state only after verified webhook handling and server confirmation.
- Depends: WS3, WS2 (WS5 for brief generation).

**WS8 · Execution sandboxes** — `packages/sandbox-tools`
- Follow current Sandbox 1.0 / Durable Object scheduling documentation; the older `Sandbox` class is 0.x. Use the documented coding-agent runner and constrain network egress, credentials, resource limits and lifetimes.
- Dynamic Workers / experimental Code Mode are optional for MCP tool-chaining scripts; any use must have explicitly scoped capabilities and outbound traffic disabled by default.
- Guard all side effects, including Git and CLI network access, not only MCP calls. Evaluate Cloudflare Artifacts against R2 diffs for versioned handoff; Artifacts requires Workers Paid.
- Registered as MCP tools behind the policy gateway.
- Container config in both top-level `containers` and `previews.containers`; verify container startup in a Preview (docs call support partial).
- Depends: WS4 (tool registration), WS1 (container config).

## Wave 3 — Closed loop & analytics (2 parallel sessions)
**WS9 · Worker Previews + QA self-heal**
- CI `wrangler preview` per trusted collaborator branch; use staging resources and isolated databases for schema changes; fork PR previews are not supported in v1. Post Preview + Deployment URLs to the PR.
- Tier 2 (required for any D1 migration): `pr-ephemeral` tofu module on PR open → override branch `previews` D1 bindings → apply migrations → `wrangler preview`.
- PR-close cleanup: delete the exact recorded Preview and any verified owned temporary resources; scope IaC state per PR and handle cleanup failures without touching shared resources.
- `cloudflare.deploy_preview` MCP tool; QA agent hits preview URL + queries observability; self-heal loop back to Dev.
- Depends: WS1, WS7, WS8.

**WS10 · Admin spend & policy audit dashboard**
- TanStack Table views styled with shadcn/ui: spend by team/repo/persona/commit pool, budget alerts, policy ALLOW/DENY audit; read-only `MAINTENANCE_ADMIN` view. Use validated Router search parameters and Query for server-filtered, paginated results, reusing TanStack DB collections where they own the displayed records; add Virtual only if needed.
- Depends: WS2, WS3 (can start earlier against seeded D1 data).

---

## Dependency summary
| Wave | Streams                                                            | Parallel sessions |
| ---- | ------------------------------------------------------------------ | ----------------- |
| 0    | WS0                                                                | 1                 |
| 1    | WS1 IaC · WS2 Start+Auth · WS3 Data/State · WS4 Policy GW · WS5 AI | 5                 |
| 2    | WS6 Agents · WS7 Workflows · WS8 Sandboxes                         | 3                 |
| 3    | WS9 Previews/QA · WS10 Admin                                       | 2                 |

## Implementation checks
- Time and schedule estimates are intentionally omitted. Repository credentials, project-state authority, Drizzle for D1 and Durable Object SQLite, GitHub-first interaction with chat deferred, TanStack AI for background-agent model/tool calls, Gateway limits plus monitoring as initial spend controls, and private-repository previews for trusted contractors with fork PRs out of scope are decided.
- Compatibility and operational checks for selected components (including Cedar/WASM, Cloudflare provider resources, and R2/OpenTofu locking) are ordinary implementation and test work, not prerequisites to starting.
- AI Gateway native spend limits are not strict hard caps.
- **Identity decision (resolved):** Better Auth on a dedicated auth D1 replaces Cognito. Analytics data never shares a database with auth/token data. Cedar principals use verified Better Auth identity and roles. Cloudflare Access protects preview hostnames and admin; QA service tokens are scoped to staging resources.
- **Tofu state bootstrap:** R2 backend needs a pre-existing bucket + credentials.
- **Secrets:** BYOK keys, GitHub OAuth app, Better Auth secret, Access service tokens — needed for live testing; streams should work against mocks without them.
- **Shared-file hotspots:** `apps/control-plane/wrangler.jsonc` and route tree (WS2, WS6, WS7, WS10) — sequence merges or have WS2 own the config.
