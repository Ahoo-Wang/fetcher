---
title: Generator reference
description: Generate Fetcher and Wow TypeScript clients from local or remote OpenAPI documents.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-generator`

The generator turns an OpenAPI JSON or YAML document into TypeScript models,
decorator API clients, and Wow command/query clients discovered from the
document contract.

## Install and run

```bash
pnpm add -D @ahoo-wang/fetcher-generator
pnpm exec fetcher-generator generate \
  --input ./openapi.yaml \
  --output ./src/generated \
  --ts-config-file-path ./tsconfig.json
```

Commit generated code only when the repository deliberately reviews generated
diffs. Otherwise generate it in CI or before build and keep the OpenAPI document
as the source of truth.

## CLI options

| Option                             | Required | Default                           |
| ---------------------------------- | -------- | --------------------------------- |
| `-i, --input <file>`               | yes      | Local path or HTTP(S) URL         |
| `-o, --output <path>`              | no       | `src/generated`                   |
| `-c, --config <file>`              | no       | `./fetcher-generator.config.json` |
| `-t, --ts-config-file-path <file>` | no       | ts-morph project defaults         |

Pass the application `tsconfig.json` so generated imports and compiler options
are checked in the same environment as their consumers.

## Configuration

```json
{
  "apiClients": {
    "Catalog": {
      "ignorePathParameters": ["tenantId", "ownerId"]
    }
  }
}
```

`apiClients` maps an OpenAPI tag name to client configuration.
`ignorePathParameters` defaults to `tenantId` and `ownerId`. A missing optional
configuration file is logged and generation continues with defaults.

## Output contract

The generator emits models and clients under each discovered bounded context,
then creates recursive `index.ts` exports and formats the generated sources.
Generated API clients depend on the matching Fetcher runtime packages, so add
the packages used by the emitted imports to application dependencies.

For Wow discovery, treat backend tags, response references, snapshot routes,
and command request bodies as generator input—not documentation decoration.
Regenerate after every contract change and compile the output before publishing.

## Generation pipeline

1. Parse the local file or remote OpenAPI document.
2. Resolve bounded contexts and aggregates from the document contract.
3. Load optional generator configuration.
4. Generate models, ordinary API clients, and discovered Wow clients.
5. Create recursive `index.ts` exports.
6. Organize, format, and save the TypeScript project.

Generation owns the output directory. Keep hand-written adapters outside it so
regeneration can replace generated files without a merge strategy.

## Wow discovery contract

| Client                | Required OpenAPI evidence                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Command               | Root-level aggregate tag, inline request body, and success response referencing `wow.CommandOk` |
| Single snapshot       | Operation matching `.snapshot_state.single`                                                     |
| Count                 | Operation matching `.snapshot.count`                                                            |
| Query and aggregation | Wow snapshot routes and response shapes recognized by the resolver                              |
| Ordinary API          | Tagged operation not claimed by a Wow-specific resolver                                         |

If one of these markers is missing, the operation may become an ordinary API
method or be skipped. Inspect the generated tree and logs; do not infer success
from process exit alone.

## Programmatic API and failures

`new CodeGenerator(options).generate()` exposes the same pipeline to build
tools. `GeneratorOptions` includes `inputPath`, `outputDir`,
`tsConfigFilePath`, `configPath`, and a logger.

Invalid input, an unreadable TypeScript config, or a model-generation failure
rejects generation. A missing default `fetcher-generator.config.json` is
logged and generation continues with `{}`. Treat that message as benign only
when the project intentionally has no generator configuration.

## Source and agent reference

- Public exports: [`packages/generator/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts)
- Detailed agent API: [`skills/fetcher-openapi-generator/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-generator/references/api.md)
- Skill: [`$fetcher-openapi-generator`](../skills/openapi-and-generation.md#fetcher-openapi-generator)

See [Generate a client](../recipes/openapi-client.md) for a minimal document and
repeatable package script.
