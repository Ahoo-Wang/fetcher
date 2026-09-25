---
name: fetcher-openapi-types
description: >
  Type OpenAPI 3.x documents in TypeScript with `@ahoo-wang/fetcher-openapi`: `OpenAPI`, `PathItem`, `Operation`, `Schema`, `Parameter`, `Response`, `Components`, `Reference` unions and `x-*` extensions. Use when reading, writing, validating or transforming an OpenAPI spec in code. Not a client generator and not an HTTP client — for calls use fetcher-integration.
---

# fetcher-openapi-types

## Decisions

- **Type-only package**: import with `import type { … } from '@ahoo-wang/fetcher-openapi'` (single entry; the built JS is empty). There are no runtime guards or `$ref` resolvers — write your own narrowing.
- **Client generation is not here**: it left fetcher in 6.0 (see `$fetcher-v6-migration`). Use these types to inspect or build specs, not to produce clients.

## Gotchas a capable model gets wrong

- Reference-able slots are `X | Reference` — `Components` values, `Operation.parameters`, `requestBody`, `Schema.items`, `properties`, `allOf`/`anyOf`/`oneOf`/`not`, response and header maps. Narrow before reading fields.
- `PathItem` has its own optional `$ref`, so a bare `'$ref' in obj` check misclassifies path items; only use it on slots typed `X | Reference`.
- `Schema.type` is `SchemaType | SchemaType[]` (3.1 `['string', 'null']`), and `exclusiveMinimum`/`exclusiveMaximum` are `boolean | number` (3.0 vs 3.1).
- The types cover 3.0 and 3.1 as a superset: `Info.title`/`version` and `Response.description` are required as in the spec, and 3.1 additions (`webhooks`, `jsonSchemaDialect`, `Info.summary`, `License.identifier`, `Components.pathItems`, `mutualTLS`) are optional fields; `Operation.responses`, `RequestBody.content` and `OAuthFlow.scopes` are required.
- Every object type except `Reference` and `SecurityRequirement` accepts `` `x-${string}` `` keys via `Extensible`; intersect with `CommonExtensions` for typed `x-internal`, `x-deprecated`, `x-tags` and friends.
- `ComponentTypeMap` maps each `Components` key to its non-reference type (e.g. `schemas` → `Schema`) for generic component lookups.

## Minimal example

```ts
import type {
  OpenAPI,
  Operation,
  Reference,
  Schema,
} from '@ahoo-wang/fetcher-openapi';

const isRef = (s: Schema | Reference): s is Reference => '$ref' in s;

export function operations(doc: OpenAPI): Operation[] {
  return Object.values(doc.paths ?? {}).flatMap(item =>
    [item.get, item.post, item.put, item.patch, item.delete].filter(
      (op): op is Operation => op !== undefined,
    ),
  );
}
```

## References

- `references/api.md`: every exported type grouped by area, field-level notes and extension types. Load it when you need exact field names.

## Related Skills

- $fetcher-integration: runtime HTTP calls against the described API.
- $fetcher-decorator-service: hand-written typed services for the operations.
