---
title: Generator reference
description: Generate Fetcher and Wow TypeScript clients from local or remote OpenAPI documents.
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

See [Generate a client](../recipes/openapi-client.md) for a minimal document and
repeatable package script.
