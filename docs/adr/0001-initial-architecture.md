# ADR 0001: Initial architecture and trust boundaries

- **Status:** Accepted for the initial implementation
- **Date:** 2026-11-25
- **Source:** [Software Factory plan v5](../software-factory-plan-v5.md)

## Context

The factory needs a shared foundation that lets independent work streams build
against stable interfaces without weakening identity, authorization, or
project-state boundaries.

## Decisions

- Run the control plane and dedicated policy and workflow Workers on Cloudflare.
- Use a per-project Durable Object as the authoritative serialized project
  state; use D1 for analytics and a separate D1 for authentication, and R2 for
  artifacts and versioned policy inputs.
- Use Better Auth for application identity, GitHub App installation tokens for
  bot actions, and user tokens only for explicitly user-attributed actions.
- Route side effects through a policy gateway; use Cedar for fine-grained
  authorization and isolated sandbox execution for repository tasks.
- Use Cloudflare Workflows for SDLC orchestration, with explicit human approval
  bound to the relevant operation and revision.
- Use TanStack Start and the TanStack libraries for the control plane, TanStack
  AI for background model/tool loops, and GitHub issues and pull requests as
  the initial human interaction surface.
- Use pnpm workspaces, Turborepo, strict TypeScript, Vitest, and Biome. Biome is
  the sole formatter and linter; ESLint and Prettier are not part of the
  toolchain.
- Keep initial previews limited to trusted collaborators in the private
  repository, use staging services and data, and exclude fork pull requests.
- Use AI Gateway spend limits with monitoring and alerts as an initial control;
  they are not a strict hard cap.

## Consequences

Shared configuration and contracts have a single owner during the foundation
work. Later streams can build in their assigned directories, while changes to
shared interfaces and trust boundaries require coordinated review. Compatibility
and security assumptions remain subject to normal implementation and testing.
