---
title: Contributing
description: Set up Fetcher locally and choose the right development, testing, or documentation workflow.
---

# Contributing

Fetcher is a version-locked monorepo. Keep changes focused, update affected
packages and documentation together, and prove behavior with the smallest
relevant gate before running the repository gate.

## Choose a workflow

- [Development](./development.md): install, build, package layout, code style,
  and versioning.
- [Testing](./testing.md): unit, integration, browser, Wiki, and Storybook gates.
- [Documentation](./documentation.md): bilingual Wiki, README, Mermaid, and
  source-verification rules.

## Pull request baseline

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test:unit
```

Add focused integration, Wiki, or Storybook checks when the changed surface
requires them. Pull requests merge squash-only; use a conventional commit title
such as `feat:`, `fix:`, `test:`, or `docs:`.
