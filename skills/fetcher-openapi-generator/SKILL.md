---
name: fetcher-openapi-generator
description: >
  Generate type-safe API clients from OpenAPI 3.0+ specifications using @ahoo-wang/fetcher-generator. Covers CLI usage (fetcher-generator), CodeGenerator programmatic API, code generation pipeline (parseOpenAPI, AggregateResolver, ModelGenerator, ClientGenerator), GeneratorConfiguration, Wow CQRS client generation (CommandClient, SnapshotQueryClient, StreamCommandClient), model generation, barrel exports, and post-processing.
  Use for: OpenAPI, code generation, fetcher-generator CLI, type-safe clients, generate API, OpenAPI spec, YAML, ts-morph, aggregate resolver, CQRS code generation.
---

# fetcher-openapi-generator

TypeScript code generator producing type-safe API clients from OpenAPI 3.0+ specs via `@ahoo-wang/fetcher-generator`, with specialized Wow CQRS/DDD framework support.

## Trigger Conditions

Activate when the user:

- Wants to generate API clients from an OpenAPI specification
- Mentions OpenAPI, code generation, `fetcher-generator` CLI
- Asks about generating TypeScript types or client code
- Needs Wow CQRS client generation (commands, queries, events)

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

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <file>` | OpenAPI spec file (JSON/YAML) or HTTP/HTTPS URL | **required** |
| `-o, --output <path>` | Output directory path | `src/generated` |
| `-c, --config <file>` | Configuration file path | `./fetcher-generator.config.json` |
| `-t, --ts-config-file-path <file>` | TypeScript config file path | — |
| `-v, --version` | Display version | — |

## Programmatic API (CodeGenerator)

```typescript
import { CodeGenerator } from '@ahoo-wang/fetcher-generator';

const generator = new CodeGenerator({
  inputPath: './openapi.yaml',
  outputDir: './src/generated',
  tsConfigFilePath: './tsconfig.json',
});
await generator.generate();
```

### Key Exports

`CodeGenerator`, `DEFAULT_CONFIG_PATH` (`./fetcher-generator.config.json`)

## Code Generation Pipeline

```
parseOpenAPI(inputPath) → AggregateResolver(openAPI).resolve()
  → ModelGenerator.generate() → ClientGenerator.generate()
    → Index Generator → Optimize (formatText, organizeImports, fixMissingImports)
```

1. **parseOpenAPI** - Parse JSON/YAML spec (local file or URL)
2. **AggregateResolver** - Identifies aggregates from tags (`{context}.{aggregate}` pattern), extracts commands, state, events, fields
3. **ModelGenerator** - Generates TypeScript types/enums from schemas (skips `wow.*` schemas and aggregated types)
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
- `ignorePathParameters` - Path parameters to exclude from generated methods (default: `['tenantId', 'ownerId']`)

## Wow CQRS Pattern Support

### Aggregate Identification

Tags following `{contextAlias}.{aggregateName}` pattern identify aggregates (e.g., `example.cart`).

### Operation Patterns

- **Commands**: Operation IDs matching `{context}.{aggregate}.{command}` with `$ref: #/components/responses/wow.CommandOk`
- **State Snapshots**: Operation IDs ending with `.snapshot_state.single`
- **Events**: Operation IDs ending with `.event.list_query`
- **Fields**: Operation IDs ending with `.snapshot.count`

### API Client Tag Exclusion

Tags named `wow`, `Actuator`, or matching aggregate names are excluded from API client generation.

### Command Clients

```typescript
// Regular command client
export class CartCommandClient<R = CommandResult> implements ApiMetadataCapable {
  constructor(public readonly apiMetadata: ApiMetadata = DEFAULT_COMMAND_CLIENT_OPTIONS) {}
  @put(CartCommandEndpointPaths.ADD_CART_ITEM)
  addCartItem(@request() commandRequest: CommandRequest<AddCartItemCommand>, @attribute() attributes?: Record<string, any>): Promise<R> {
    throw autoGeneratedError(commandRequest, attributes);
  }
}
// Stream variant (extends CommandClient<CommandResultEventStream>)
export class CartStreamCommandClient extends CartCommandClient<CommandResultEventStream> {}
```

Command types use `CommandBody<T>` wrapper. `CommandEndpointPaths` enum maps command names to paths.

### Query Clients

```typescript
export const cartQueryClientFactory = new QueryClientFactory<CartState, CartAggregatedFields | string, CartDomainEventType>({
  contextAlias: EXAMPLE_BOUNDED_CONTEXT_ALIAS,
  aggregateName: 'cart',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
});
```

Resource attribution inferred from command paths: `ResourceAttributionPathSpec.OWNER` (`/owner/{ownerId}`), `ResourceAttributionPathSpec.TENANT` (`/tenant/{tenantId}`), or `NONE`.

### API Clients

Generated for non-CQRS endpoints. Parameters `tenantId`/`ownerId` are ignored by default.

## Integration with Fetcher

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { cartQueryClientFactory } from './generated/example/cart/queryClient';
import { CartCommandClient } from './generated/example/cart/commandClient';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const snapshotClient = cartQueryClientFactory.createSnapshotQueryClient({ fetcher });
const commandClient = new CartCommandClient();
```

## Package Reference

- [Package Source](https://github.com/Ahoo-Wang/fetcher/tree/main/packages/generator/) - Source code and README
- Key types: `GeneratorOptions`, `GeneratorConfiguration`, `ApiClientConfiguration`, `GenerateContextInit`, `Logger`
