---
title: Generator reference
description: Generate TypeScript models and Fetcher or Wow clients from an OpenAPI JSON or YAML document.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-generator`

Generate TypeScript models, ordinary decorator API clients, and recognized Wow command/query clients from a local or remote OpenAPI document. The generator owns its output tree: keep hand-written code outside it and regenerate after a contract change.

## Install and run

```bash
pnpm add -D @ahoo-wang/fetcher-generator
pnpm exec fetcher-generator generate \
  --input ./openapi.yaml \
  --output ./src/generated \
  --ts-config-file-path ./tsconfig.json
```

The package requires Node.js `>=18.20.8`. Generated code may import Fetcher, Decorator, EventStream, OpenAPI, and Wow packages; install the runtime packages actually imported by generated files ([`package.json:30`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/package.json#L30), [`package.json:61`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/package.json#L61)).

## CLI contract

`fetcher-generator` has one `generate` command. Input accepts a file path or HTTP(S) URL; unsupported URL protocols and blocked private/link-local remote addresses exit `2`. `SIGINT` exits `130`; generation errors exit `1` ([`clis.ts:90`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L90), [`clis.ts:123`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L123)).

| Option | Required | Default | Meaning |
| --- | --- | --- | --- |
| `-i, --input <file>` | Yes | — | Local OpenAPI file or an HTTP(S) URL accepted by the input guard. |
| `-o, --output <path>` | No | `src/generated` | Generated root directory. |
| `-c, --config <file>` | No | `./fetcher-generator.config.json` | JSON or YAML configuration path. |
| `-t, --ts-config-file-path <file>` | No | ts-morph defaults | TypeScript project configuration path. |
| `-v, --version` | No | — | Print package version. |

These are the complete declared command options ([`cli.ts:17`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L17)).

## Configuration and precedence

The CLI passes `--config` to `CodeGenerator`; when absent, `DEFAULT_CONFIG_PATH` is `./fetcher-generator.config.json`. A missing, unreadable, or unparsable configuration file is logged and generation continues with `{}`. A successfully parsed object has no runtime shape validation: an incorrectly typed field can fail later when its consumer uses it ([`index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27), [`index.ts:99`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L99), [`parsers.ts:38`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/parsers.ts#L38)).

```json
{
  "apiClients": {
    "Catalog": {
      "ignorePathParameters": ["tenantId", "ownerId"]
    }
  }
}
```

| Setting | Applies to | Default / precedence |
| --- | --- | --- |
| `apiClients.<tag>.ignorePathParameters` | Ordinary API client for that exact tag | Tag array replaces default. |
| No tag configuration | Ordinary API client | Ignore `tenantId`, `ownerId`. |
| Command client | Wow command client | Always ignores `tenantId`, `ownerId`; `apiClients` does not override it. |
| Missing, unreadable, or unparsable config | Entire run | Log the failure, then use an empty configuration. |
| Successfully parsed but wrong-shaped config | Later consumer | No runtime validation; correct the JSON/YAML field type. |

The parser infers JSON or YAML from content rather than filename ([`parsers.ts:25`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/parsers.ts#L25)); parameter behavior is implemented in [`generateContext.ts:53`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/generateContext.ts#L53).

## Output and pipeline

A real `test/demo.spec.json` run produces this shape (names follow the document's context and aggregate tags):

```text
src/generated/
├── index.ts
└── example/
    ├── boundedContext.ts
    ├── CartApiClient.ts
    ├── OrderApiClient.ts
    ├── types.ts
    ├── index.ts
    ├── cart/{commandClient,queryClient,types,index}.ts
    └── order/{commandClient,queryClient,types,index}.ts
```

1. Load local or remote text; parse JSON or YAML.
2. Resolve aggregate definitions from root tags and operations.
3. Load optional configuration.
4. Generate models, ordinary API clients, and recognized Wow clients.
5. If `project.getDirectory(outputDir)` exists, create an `index.ts` for each non-empty generated directory.
6. In that same branch, format imports/source and save the ts-morph project.

After model/client generation, `generate()` checks for the output directory. Only a created output directory (that is, generated source exists) enters the index, format, and save phase. With an empty document or no generatable symbols, it logs `Output directory not found.` and returns normally; the CLI then still prints success and exits `0` ([`index.ts:126`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L126), [`clis.ts:145`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L145)). Recursive index generation excludes an existing `index.ts` and rewrites generated indexes ([`index.ts:187`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L187)).

## Programmatic API

The package root exports only `CodeGenerator` and `DEFAULT_CONFIG_PATH` ([`index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27)). `GeneratorOptions`, `Logger`, parsers, and resolvers are source-internal modules: do not import them as package-root API.

```ts
import { CodeGenerator } from '@ahoo-wang/fetcher-generator';

const logger = {
  info: console.info,
  success: console.info,
  error: console.error,
  progress: console.info,
  progressWithCount: console.info,
};

await new CodeGenerator({
  inputPath: './openapi.yaml',
  outputDir: './src/generated',
  tsConfigFilePath: './tsconfig.json',
  logger,
}).generate();
```

| Member | Input / return | Contract |
| --- | --- | --- |
| `new CodeGenerator(options)` | `inputPath`, `outputDir`, `logger`; ts-morph project options and optional `configPath` → instance | Creates the ts-morph `Project`; the options type itself is not a package-root export. |
| `generate()` | `Promise<void>` | Parses, resolves, generates, and conditionally indexes/formats/saves the output. |
| `generateIndex(outputDir)` | ts-morph `Directory` → `void` | Recursively writes `index.ts` exports for non-empty directories. |
| `optimizeSourceFiles(outputDir)` | ts-morph `Directory` → `void` | Formats source, organizes imports, and fixes missing imports. |

The public methods are defined at [`index.ts:54`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L54), [`index.ts:80`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L80), [`index.ts:157`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L157), and [`index.ts:248`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L248).

## Wow discovery matrix

| Generated concern | Required document evidence |
| --- | --- |
| Aggregate candidate | Root-level tag exactly `contextAlias.aggregateName`. |
| Command | Three-part `operationId`, a non-`wow.command.send` operation, `$ref` response `#/components/responses/wow.CommandOk`, and an inline JSON request-body reference. |
| Single snapshot state | `operationId` ending `.snapshot_state.single` with an OK JSON schema reference. |
| Query fields | `operationId` ending `.snapshot.count`; `Operation.requestBody` must be a `#/components/requestBodies/...` reference. On the resolved `RequestBody`, `x-wow-query-fields` must be a schema reference, or the legacy `content.application/json.schema.properties.field` must be one. Inline request bodies are not supported by this resolver. |
| Complete Wow aggregate | Both state and fields results; otherwise it is excluded from resolved aggregates. |
| Ordinary API client | Tagged operations not claimed by aggregate/Actuator/wow filters. |

Commands attach only to matching operation tags; incomplete state or fields excludes an aggregate from the resolved result ([`aggregateResolver.ts:85`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L85), [`aggregateResolver.ts:110`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L110), [`aggregateResolver.ts:261`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L261)).

## Reproducible diagnosis

```bash
pnpm --filter @ahoo-wang/fetcher-generator build
cd packages/generator
node dist/cli.js generate \
  -i test/demo.spec.json \
  -o /tmp/fetcher-reference-generator-check \
  -t tsconfig.json
find /tmp/fetcher-reference-generator-check -type f -print -quit
```

| Symptom | Check |
| --- | --- |
| `Invalid input` / exit `2` | Use a non-empty local path or an HTTP(S) URL accepted by the guard; private/link-local remote addresses are rejected. |
| `Configuration file parsing failed` | Benign only when no config is intended; otherwise pass `-c` with readable JSON/YAML. |
| Parsed configuration later throws | The file parsed but its object shape is not validated; check the type of `apiClients.<tag>.ignorePathParameters`. |
| Parse/generation error / exit `1` | Check input contents, path/URL reachability, and supplied TypeScript configuration. |
| Exit `0` but expected Wow client is absent | Check the discovery matrix, generated tree, and logs; missing state or fields excludes an aggregate. |
| Exit `0` but there are no output files | Check for `Output directory not found.`: no output directory was created, so indexing/formatting/saving were skipped and the CLI still reported success. |
| Generated code fails application compilation | Pass the consumer `tsconfig` and install packages imported by generated files. |

The repository E2E test uses this fixture and asserts both API and Wow command output ([`e2e.test.ts:125`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/test/e2e.test.ts#L125)).

## Source reference

- [CLI: `packages/generator/src/cli.ts:17`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L17)
- [Public API/pipeline: `packages/generator/src/index.ts:27`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/index.ts#L27)
- [Configuration: `packages/generator/src/types.ts:21`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/types.ts#L21)
- [Input/exit states: `packages/generator/src/utils/clis.ts:90`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/clis.ts#L90)
- [Wow resolver: `packages/generator/src/aggregate/aggregateResolver.ts:52`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/aggregate/aggregateResolver.ts#L52)
- [Request-body resolution: `packages/generator/src/utils/components.ts:89`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/utils/components.ts#L89)
