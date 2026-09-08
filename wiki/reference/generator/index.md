---
title: 'Generator reference'
description: 'Generator reference — Fetcher 5.0.0'
---

# Generator reference

Generate TypeScript models and decorator clients from an OpenAPI document, with optional Wow CQRS discovery. The only root symbols are CodeGenerator and DEFAULT_CONFIG_PATH.

## Install

```bash
pnpm add -D @ahoo-wang/fetcher-generator
```

Version baseline: **5.0.0**. This package declares Node **>=18.20.8**; the repository contributor toolchain is separate. Install peer packages required by your selected runtime integration.

## Minimal example

```bash
pnpm exec fetcher-generator generate -i ./openapi.json -o ./src/generated -t ./tsconfig.json
```

## Topics

- [Generator CLI](/reference/generator/cli)
- [Generator configuration](/reference/generator/configuration)
- [Programmatic API](/reference/generator/programmatic-api)
- [Generated output and regeneration](/reference/generator/generated-output)
- [Wow aggregate discovery](/reference/generator/wow-discovery)

## Public symbol index

| Symbol                | Reference                                                  |
| --------------------- | ---------------------------------------------------------- |
| `CodeGenerator`       | [Programmatic API](/reference/generator/programmatic-api#codegenerator-api)   |
| `DEFAULT_CONFIG_PATH` | [Programmatic API](/reference/generator/programmatic-api#default_config_path) |

[packages/generator/src/index.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L35)
