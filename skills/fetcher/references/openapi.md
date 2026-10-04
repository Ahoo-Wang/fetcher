# OpenAPI document types — `@ahoo-wang/fetcher-openapi`

TypeScript types for OpenAPI 3.0 and 3.1 documents (`OpenAPI`, `PathItem`,
`Operation`, `Parameter`, `Response`, `Schema`, `Components`, `Reference`, …).
**Types only**: no validator, resolver, iterator or `isReference` guard, and no
HTTP client or code generator. Import with `import type`.

## What the types do not tell you

- **No runtime helpers.** `IsReference<T>` is a conditional type, not a guard.
  Write your own narrowing.
- **`'$ref' in x` narrows `Schema | Reference`** (and other `X | Reference`
  where `X` has no `$ref`) but **not** `PathItem | Reference`: `PathItem` has
  its own optional `$ref`. For `OpenAPI.webhooks`, `Components.pathItems` and
  `Callback`, test `typeof item.$ref === 'string'`.
- **A component can itself be a `$ref`.** `doc.components?.schemas?.[name]` is
  `Schema | Reference | undefined`: resolve in a loop and guard against cycles.
  Names in a `$ref` are JSON-Pointer escaped (`~1` → `/`, `~0` → `~`). A 3.1
  schema may also point at a local `#/$defs/…`, which is not under `components`.
- **Map objects carry `x-*` keys at run time.** `Paths`, `Responses` and
  `Callback` are `Extensible`, so `Object.entries(doc.paths)` can yield an
  `x-…` entry typed as `PathItem`. Skip keys that start with `x-`.
- **Extensions are `any` unless you type them.** `operation['x-internal']`
  is `any`. Intersect with `CommonExtensions` or your own
  `{ 'x-rate-limit'?: number }` to get checking. Unknown non-`x-` keys are
  rejected.
- **3.0 and 3.1 share one `Schema` type.** Handle both nullability forms:
  `s.nullable === true || (Array.isArray(s.type) && s.type.includes('null'))`.
  `exclusiveMinimum`/`exclusiveMaximum` are `boolean` (3.0 flag) or `number`
  (3.1 bound). 3.1 keywords (`$defs`, `prefixItems`, `if`/`then`/`else`,
  `unevaluatedProperties`, …) are optional fields.
- **`examples` differs by object**: `any[]` on `Schema`, a
  `Record<string, Example | Reference>` on `Parameter`, `MediaType` and `Header`.
- **Response keys are strings** (`'200'`, `'2XX'`, `'default'`), each value
  `Response | Reference`. `Response.description`, `Info.title` and
  `Info.version` are required. `OpenAPI.paths` is required even for a
  webhooks-only 3.1 document (use `paths: {}`).
- **Parameters**: effective parameters are `PathItem.parameters` merged with
  `Operation.parameters` (operation wins on the same `name` + `in`). Both are
  `(Parameter | Reference)[]`. `required: true` for `in: 'path'` is not
  enforced by the type. `SecurityScheme.in` excludes `'path'`.
- **`JSON.parse` returns `any`**: annotating it as `OpenAPI` is a claim, not a
  check. Validate untrusted input with a real validator first.
- Every method is in `HTTPMethod`: `get`, `put`, `post`, `delete`, `options`,
  `head`, `patch`, `trace`. Do not stop at five.

## Example

```ts
import type {
  CommonExtensions,
  HTTPMethod,
  OpenAPI,
  Operation,
  Reference,
  Schema,
} from '@ahoo-wang/fetcher-openapi';

const METHODS: readonly HTTPMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

export function operationIds(doc: OpenAPI): string[] {
  const ids: string[] = [];
  for (const [path, item] of Object.entries(doc.paths)) {
    if (path.startsWith('x-') || !item) continue;
    for (const method of METHODS) {
      const id = item[method]?.operationId;
      if (id) ids.push(id);
    }
  }
  return ids;
}

export function resolveSchema(
  doc: OpenAPI,
  schema: Schema | Reference,
): Schema {
  const seen = new Set<string>();
  const prefix = '#/components/schemas/';
  while ('$ref' in schema) {
    const ref = schema.$ref;
    if (!ref.startsWith(prefix) || seen.has(ref))
      throw new Error(`Cannot resolve ${ref}`);
    seen.add(ref);
    const name = ref
      .slice(prefix.length)
      .replace(/~1/g, '/')
      .replace(/~0/g, '~');
    const next = doc.components?.schemas?.[name];
    if (!next) throw new Error(`Missing ${ref}`);
    schema = next;
  }
  return schema;
}

type TaggedOperation = Operation &
  CommonExtensions & { 'x-rate-limit'?: number };
const isPublic = (operation: TaggedOperation) =>
  operation['x-internal'] !== true;
```
