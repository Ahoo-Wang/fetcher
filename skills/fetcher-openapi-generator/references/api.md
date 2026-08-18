# Fetcher OpenAPI Generator API Reference

## Contents

- [Installation](#installation)
- [CLI Usage](#cli-usage)
  - [CLI Options](#cli-options)
- [Programmatic API (CodeGenerator)](#programmatic-api-codegenerator)
  - [Key Exports](#key-exports)
- [Code Generation Pipeline](#code-generation-pipeline)
- [Generated Output Structure](#generated-output-structure)
- [Configuration (fetcher-generator.config.json)](#configuration-fetcher-generatorconfigjson)
- [Wow CQRS Pattern Support](#wow-cqrs-pattern-support)
  - [Aggregate Identification](#aggregate-identification)
  - [Operation Patterns](#operation-patterns)
  - [API Client Tag Exclusion](#api-client-tag-exclusion)
  - [Command Clients](#command-clients)
  - [Query Clients](#query-clients)
  - [API Clients](#api-clients)
- [Integration with Fetcher](#integration-with-fetcher)
- [Package Reference](#package-reference)

TypeScript code generator producing type-safe API clients from OpenAPI 3.0+ specs via `@ahoo-wang/fetcher-generator`, with specialized Wow CQRS/DDD framework support.

## Installation

```bash
pnpm add -D @ahoo-wang/fetcher-generator
```

## CLI Usage

```bash
# Basic usage
npx fetcher-generator generate -i ./openapi.yaml -o ./src/generated

# With config file
npx fetcher-generator generate -i ./openapi.yaml -o ./src/generated -c ./fetcher-generator.config.json

# From URL
npx fetcher-generator generate -i https://api.example.com/openapi.json -o ./src/generated

# With TypeScript config
npx fetcher-generator generate -i ./openapi.yaml -o ./src/generated -t ./tsconfig.json
```

### CLI Options

| Flag                               | Description                                     | Default                           |
| ---------------------------------- | ----------------------------------------------- | --------------------------------- |
| `-i, --input <file>`               | OpenAPI spec file (JSON/YAML) or HTTP/HTTPS URL | **required**                      |
| `-o, --output <path>`              | Output directory path                           | `src/generated`                   |
| `-c, --config <file>`              | Configuration file path                         | `./fetcher-generator.config.json` |
| `-t, --ts-config-file-path <file>` | TypeScript config file path                     | —                                 |
| `-v, --version`                    | Display version                                 | —                                 |

## Programmatic API (CodeGenerator)

`logger` is a required option (`Logger` interface: `info`/`success`/`error`/`progress`/`progressWithCount`). The package does not export a logger implementation — provide your own:

```typescript
import { CodeGenerator } from '@ahoo-wang/fetcher-generator';

const generator = new CodeGenerator({
  inputPath: './openapi.yaml',
  outputDir: './src/generated',
  tsConfigFilePath: './tsconfig.json',
  logger: {
    info: console.info,
    success: console.info,
    error: console.error,
    progress: console.info,
    progressWithCount: (current, total, message) =>
      console.info(`${message} (${current}/${total})`),
  },
});
await generator.generate();
```

### Key Exports

`CodeGenerator`, `DEFAULT_CONFIG_PATH` (`./fetcher-generator.config.json`) — that is the complete public surface; option and config interfaces (`GeneratorOptions`, `GeneratorConfiguration`) are not re-exported from the package entry.

## Code Generation Pipeline

```
parseOpenAPI(inputPath) → AggregateResolver(openAPI).resolve()
  → ModelGenerator.generate() → ClientGenerator.generate()
    → Index Generator → Optimize (formatText, organizeImports, fixMissingImports)
```

1. **parseOpenAPI** - Parse JSON/YAML spec (local file or URL)
2. **AggregateResolver** - Identifies aggregates from tags (`{context}.{aggregate}` pattern), extracts commands, state, events, fields
3. **ModelGenerator** - Generates TypeScript types/enums from schemas (skips `wow.*` schemas except `wow.api.query.*PagedList` and `wow.api.query.Operator*Map`; the exact base `wow.api.query.PagedList` is skipped too, and aggregate-specific `*PagedList` schemas map to `PagedList` from `@ahoo-wang/fetcher-wow`)
4. **ClientGenerator** - Generates QueryClient, CommandClient, StreamCommandClient, ApiClient per aggregate
5. **Index Generator** - Creates `index.ts` barrel exports at every directory level
6. **Post-processing** - `formatText()`, `organizeImports()`, `fixMissingImports()` on all files

## Generated Output Structure

```
output/
├── index.ts                        # Root barrel exports
├── {bounded-context}/
│   ├── index.ts                    # Context barrel exports
│   ├── boundedContext.ts           # Context alias constant (e.g., EXAMPLE_BOUNDED_CONTEXT_ALIAS)
│   ├── types.ts                    # Shared types for this context path
│   ├── {Tag}ApiClient.ts           # API client per non-CQRS tag
│   └── {aggregate}/
│       ├── index.ts
│       ├── commandClient.ts        # CommandClient + StreamCommandClient + CommandEndpointPaths
│       └── queryClient.ts          # QueryClientFactory + DomainEventType + DomainEventTypeMapTitle
├── {other-schema-path}/
│   ├── types.ts                    # Types for schemas in other dot-separated paths
│   └── ...
```

Model files use `types.ts` named by schema path prefix (e.g., schema key `ai.AiMessage.Assistant` maps to `ai/types.ts` with type `AiMessageAssistant`).

## Configuration (fetcher-generator.config.json)

```json
{
  "apiClients": {
    "TagName": {
      "ignorePathParameters": ["tenantId", "ownerId"]
    }
  }
}
```

- `apiClients` - Map of tag name to API client configuration
- `ignorePathParameters` - Path parameters to exclude from generated **API client** methods (default: `['tenantId', 'ownerId']`). Command clients always ignore `tenantId`/`ownerId` regardless of this setting.

## Wow CQRS Pattern Support

### Aggregate Identification

Aggregates are discovered **only from the root `tags:` array** — tags appearing solely on operations are ignored. Tags following `{contextAlias}.{aggregateName}` pattern identify aggregates (e.g., `example.cart`).

An aggregate is emitted only when **both** a state snapshot and a fields definition resolve for it; otherwise the tag falls through to plain API client generation.

### Operation Patterns

- **Commands**: Operation IDs matching `{context}.{aggregate}.{command}` with a request body and an OK response `$ref: #/components/responses/wow.CommandOk` ("OK" means strictly `responses['200']`; the operation `wow.command.send` is skipped)
- **State Snapshots**: Operation IDs ending with `.snapshot_state.single`
- **Events**: Operation IDs ending with `.event.list_query`
- **Fields**: Operation IDs ending with `.snapshot.count`

### API Client Tag Exclusion

Tags named `wow`, `Actuator`, or matching aggregate names are excluded from API client generation.

### Command Clients

```typescript
// Regular command client
export class CartCommandClient<
  R = CommandResult,
> implements ApiMetadataCapable {
  constructor(
    public readonly apiMetadata: ApiMetadata = DEFAULT_COMMAND_CLIENT_OPTIONS,
  ) {}
  @put(CartCommandEndpointPaths.ADD_CART_ITEM)
  addCartItem(
    @request() commandRequest: CommandRequest<AddCartItemCommand>,
    @attribute() attributes?: Record<string, any>,
  ): Promise<R> {
    throw autoGeneratedError(commandRequest, attributes);
  }
}
// Stream variant (extends CommandClient<CommandResultEventStream>)
export class CartStreamCommandClient extends CartCommandClient<CommandResultEventStream> {}
```

Command types use `CommandBody<T>` wrapper. `CommandEndpointPaths` enum maps command names to paths.

### Query Clients

```typescript
export const cartQueryClientFactory = new QueryClientFactory<
  CartState,
  CartAggregatedFields | string,
  CartDomainEventType
>({
  contextAlias: EXAMPLE_BOUNDED_CONTEXT_ALIAS,
  aggregateName: 'cart',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
});
```

When an aggregate has no `.event.list_query` operation, its generated `DomainEventType` is `never`.

Resource attribution inferred from command paths: `ResourceAttributionPathSpec.OWNER` (`/owner/{ownerId}`), `ResourceAttributionPathSpec.TENANT` (`/tenant/{tenantId}`), or `NONE`.

### API Clients

Generated for non-CQRS endpoints. Parameters `tenantId`/`ownerId` are ignored by default.

## Integration with Fetcher

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { cartQueryClientFactory } from './generated/example/cart/queryClient';
import { CartCommandClient } from './generated/example/cart/commandClient';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const snapshotClient = cartQueryClientFactory.createSnapshotQueryClient({
  fetcher,
});
const commandClient = new CartCommandClient();
```

## Package Reference

- [Package Source](https://github.com/Ahoo-Wang/fetcher/tree/main/packages/generator/) - Source code and README
- CLI: `fetcher-generator`; programmatic entry: `CodeGenerator` (see Key Exports above)
