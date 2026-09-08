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

## Earlier section links

Earlier reference links still lead to the corresponding topics below.

| Earlier section | Current topic |
| --- | --- |
| <span id="install-and-run"></span>Install and run | [Read this topic](/reference/generator/index.md) |
| <span id="cli-contract"></span>CLI contract | [Read this topic](/reference/generator/cli.md) |
| <span id="remote-input-guard"></span>Remote-input guard | [Read this topic](/reference/generator/cli.md) |
| <span id="configuration-and-precedence"></span>Configuration and precedence | [Read this topic](/reference/generator/configuration.md) |
| <span id="output-and-pipeline"></span>Output and pipeline | [Read this topic](/reference/generator/generated-output.md) |
| <span id="programmatic-api"></span>Programmatic API | [Read this topic](/reference/generator/programmatic-api.md) |
| <span id="wow-discovery-matrix"></span>Wow discovery matrix | [Read this topic](/reference/generator/wow-discovery.md) |
| <span id="reproducible-diagnosis"></span>Reproducible diagnosis | [Read this topic](/reference/generator/index.md) |
| <span id="source-reference"></span>Source reference | [Read this topic](/reference/generator/index.md) |
