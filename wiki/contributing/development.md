---
title: Development
description: Install the Fetcher monorepo, understand package boundaries, and follow its TypeScript workflow.
---

# Development

## Requirements

- Node.js 20.19.0 or newer for this repository's Vite 8 and Vitest 4 toolchain
- pnpm 10.34.5 through Corepack
- Git

Published Fetcher runtime packages keep their separate Node.js 18.20.8 floor;
the higher version here is the monorepo development requirement.

## Set up the repository

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

Build before tests when generated declarations or package outputs may be
consumed by another workspace package.

## Work by package

```bash
pnpm --filter @ahoo-wang/fetcher build
pnpm --filter @ahoo-wang/fetcher test
pnpm --filter @ahoo-wang/fetcher vitest run src/fetcher.test.ts
```

The core package has no internal dependency. Decorator, event bus, streaming,
OpenAI, OpenAPI, generator, React, storage, CoSec, Wow, and Viewer build on it in
layers. Keep shared behavior in the lowest existing package that owns it.

## Code style

- Strict TypeScript and ES modules.
- Single quotes, semicolons, trailing commas, and 80-column Prettier output.
- Prefer type-only imports where ESLint requires them.
- Put `*.test.ts` / `*.test.tsx` beside the source.
- Preserve the Apache 2.0 header in source files.
- Add dependencies through the root catalog in `pnpm-workspace.yaml`.

Run `pnpm lint` and `pnpm format` only for intentional repository-wide cleanup;
format focused files during normal changes.

## Versions and releases

All packages share one version. Update them together with:

```bash
pnpm update-version 3.19.0
```

Changing a public API requires an intentional version decision and synchronized
Wiki, README, and package skill references. Publishing is handled by the release
workflow, not a local development step.
