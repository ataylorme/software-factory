# Software Factory

The shared foundation for the Software Factory monorepo. The workspace follows
the [work-stream plan](docs/workstreams.md); implementation decisions are
recorded in [architecture decision records](docs/adr/).

## Requirements

- Node.js 22.12 or newer
- pnpm 10.30.3

## Getting started

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

`pnpm check` runs all three checks. Shared runtime schemas and TypeScript
contracts live in `packages/contracts`; application and package directories
are scaffolded for the independent work streams.
