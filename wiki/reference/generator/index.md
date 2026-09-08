---
prev: false
title: 'Generator reference'
description: 'Generator reference — Fetcher 5.0.0'
---

# Generator reference

Generate TypeScript models and decorator clients from an OpenAPI document, with optional Wow CQRS discovery. The only root symbols are CodeGenerator and DEFAULT_CONFIG_PATH.

## Install

```bash
pnpm add -D @ahoo-wang/fetcher-generator @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-openapi @ahoo-wang/fetcher-wow typescript
```

Version **5.0.0** itself declares Node **>=18.20.8**, but its CLI dependency commander 14 requires Node **>=20**. Use Node **>=20.20.2** for this toolchain; repository development additionally pins pnpm **10.34.5**. The command includes all recursive peers (Generator → Wow/Decorator/EventStream/OpenAPI → Fetcher) and the compiler used below. ts-morph, commander and yaml install automatically as regular dependencies. These are generation-time dependencies; generated clients need their imported packages installed as runtime dependencies in the consuming application, as listed under [generated output](./generated-output.md).

## Minimal example

```bash
pnpm exec fetcher-generator generate -i ./openapi.json -o ./src/generated -t ./tsconfig.json
```

## Choose an entry point

Use the CLI for a reproducible build step and `CodeGenerator.generate()` for a Node script with a custom logger. Both produce source files; neither executes API operations. Start with the complete [CLI input and tsconfig](./cli.md), then check [output ownership](./generated-output.md) before regenerating.

## Topics

- [Generator CLI](cli)
- [Generator configuration](configuration)
- [Programmatic API](programmatic-api)
- [Generated output and regeneration](generated-output)
- [Wow aggregate discovery](wow-discovery)

[Complete public symbol index](./symbols.md)
