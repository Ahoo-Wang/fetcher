---
name: fetcher-openapi-types
description: >
  Type OpenAPI 3.0/3.1 documents in TypeScript with the type-only `@ahoo-wang/fetcher-openapi`: `OpenAPI`, `PathItem`, `Operation`, `Schema` (incl. JSON Schema 2020-12 keywords), `Parameter`, `Components`, `X | Reference` unions, `x-*` extensions. Use when reading, writing, walking or transforming a spec in code. Not a client generator (moved out of fetcher in 6.0) and not an HTTP client — for calls use fetcher-integration.
---

# fetcher-openapi-types

## Decisions

- **Type-only package**: import with `import type { … } from '@ahoo-wang/fetcher-openapi'` (single entry; the built JS is empty). There are no runtime guards or `$ref` resolvers — write your own narrowing.
- **Client generation is not here**: it left fetcher in 6.0 (see `$fetcher-v6-migration`). Use these types to inspect or build specs, not to produce clients.

## Gotchas a capable model gets wrong

- Reference-able slots are `X | Reference` — `Components` values, `Operation.parameters`, `requestBody`, `Responses` entries, `Schema.items`, `properties`, `allOf`/`anyOf`/`oneOf`/`not`, `$defs`, `prefixItems`, `if`/`then`/`else`, header/example/link maps, `webhooks`. Narrow before reading fields. Not reference-able: `Paths` values, `Callback` values, `content` media types.
- `PathItem` has its own optional `$ref`, so a bare `'$ref' in obj` check misclassifies path items; only use it on slots typed `X | Reference`. `Schema` declares no `$ref`, so `'$ref' in schema` is the Schema/Reference test.
- `additionalProperties`, `unevaluatedProperties` and `unevaluatedItems` are `boolean | Schema | Reference`: rule out the boolean before `'$ref' in`.
- `Paths` and `Responses` also accept `x-*` keys: skip keys starting with `x-` when iterating paths, and `Responses` values are `Response | Reference | undefined`.
- `Schema.type` is `SchemaType | SchemaType[]` (3.1 `['string', 'null']`), and `exclusiveMinimum`/`exclusiveMaximum` are `boolean | number` (3.0 vs 3.1).
- The types cover 3.0 and 3.1 as a superset: `OpenAPI.paths`, `Info.title`/`version` and `Response.description` are required as in the spec, and 3.1 additions (`webhooks`, `jsonSchemaDialect`, `Info.summary`, `License.identifier`, `Components.pathItems`, `mutualTLS`) are optional fields; `Operation.responses`, `RequestBody.content` and `OAuthFlow.scopes` are required.
- Every object type except `Reference` and `SecurityRequirement` accepts `` `x-${string}` `` keys via `Extensible`; intersect with `CommonExtensions` for typed `x-internal`, `x-deprecated`, `x-tags` and friends.
- `ComponentTypeMap` maps each `Components` key to its non-reference type (e.g. `schemas` → `Schema`) for generic component lookups.

## Minimal example

```ts
import type {
  HTTPMethod,
  OpenAPI,
  Operation,
  Reference,
  Schema,
} from '@ahoo-wang/fetcher-openapi';

const METHODS: HTTPMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

export const isRef = <T extends object>(
  value: T | Reference,
): value is Reference => '$ref' in value;

export function operations(doc: OpenAPI): Operation[] {
  return Object.entries(doc.paths)
    .filter(([path]) => !path.startsWith('x-'))
    .flatMap(([, item]) =>
      METHODS.map(method => item[method]).filter(
        (op): op is Operation => op !== undefined,
      ),
    );
}

// '#/components/schemas/User' → the Schema, following chained references.
export function resolveSchema(
  doc: OpenAPI,
  schema: Schema | Reference,
): Schema | undefined {
  const seen = new Set<string>();
  let current: Schema | Reference | undefined = schema;
  while (current && isRef(current)) {
    const prefix = '#/components/schemas/';
    if (!current.$ref.startsWith(prefix) || seen.has(current.$ref)) return;
    seen.add(current.$ref);
    const name: string = current.$ref
      .slice(prefix.length)
      .replace(/~1/g, '/')
      .replace(/~0/g, '~');
    current = doc.components?.schemas?.[name];
  }
  return current;
}
```

## References

- `references/api.md`: every exported type grouped by area, field-level notes and extension types. Load it when you need exact field names.

## Related Skills

- $fetcher-integration: runtime HTTP calls against the described API.
- $fetcher-decorator-service: hand-written typed services for the operations.
