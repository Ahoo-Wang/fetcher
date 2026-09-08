---
title: Set up the monorepo
description: Set up the monorepo — Fetcher
---

# Set up the monorepo

## Match the toolchain

Use Node `>=20.20.2` and pnpm `10.34.5`, as declared by the root package.json. Package consumers have their own engine and peer requirements; see [Installation](../start/installation.md).

```bash
pnpm install --frozen-lockfile
pnpm build
```

The workspace includes packages, integration-test, and wiki. Build dependencies before checking a package that imports their outputs.

## Work on one package

```bash
pnpm --filter @ahoo-wang/fetcher-react... build
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher exec vitest run test/fetcher.test.ts
```

The trailing `...` includes workspace dependencies. Read each package.json for its scripts and each Vitest config for its environment. Do not assume tests live under src.

## Keep the diff reviewable

Use strict TypeScript, ES modules, type-only imports, and Apache headers. Root `pnpm lint` applies fixes and `pnpm format` rewrites the repository; prefer checks limited to changed files and inspect their diff.

Get approval before adding packages or changing root TypeScript/build configuration unless the task already authorizes it. External dependency versions belong in the workspace catalog; internal dependencies use workspace protocol. Align package versions using `pnpm update-version <version>` when a version change is authorized.
