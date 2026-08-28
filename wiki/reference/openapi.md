---
title: OpenAPI reference
description: Type OpenAPI documents and extensions without adding runtime code.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openapi`

This is a type-only package for OpenAPI 3.x documents. It has no runtime
dependencies and does not parse, validate, or generate code.

## Install

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

## Type a document

```ts
import type { OpenAPI, Operation, Schema } from '@ahoo-wang/fetcher-openapi';

export function operationIds(document: OpenAPI): string[] {
  return Object.values(document.paths).flatMap(pathItem =>
    Object.values(pathItem ?? {})
      .filter((value): value is Operation => typeof value === 'object')
      .flatMap(operation => operation.operationId ?? []),
  );
}

export const pageSchema: Schema = {
  type: 'object',
  properties: {
    total: { type: 'integer', format: 'int64' },
  },
};
```

## Export groups

| Group      | Representative types                                      |
| ---------- | --------------------------------------------------------- |
| Document   | `OpenAPI`, `Info`, `Tag`, `Server`                        |
| Paths      | `Paths`, `PathItem`, `Operation`                          |
| Inputs     | `Parameter`, `RequestBody`, `MediaType`                   |
| Outputs    | `Responses`, `Response`, `Header`, `Link`                 |
| Models     | `Schema`, `Discriminator`, `XML`                          |
| Reuse      | `Components`, `Reference`                                 |
| Security   | `SecurityScheme`, `SecurityRequirement`, OAuth flow types |
| Extensions | `Extensible` and `x-*` extension support                  |

## Document contracts

### References and reusable components

Use `Reference` where OpenAPI allows `$ref`, and place reusable schema,
response, parameter, request-body, header, security, example, link, and callback
objects under `Components`. A reference identifies another document node; this
package does not dereference it at runtime.

### Schema families

| Schema kind | Important fields                                                   |
| ----------- | ------------------------------------------------------------------ |
| Primitive   | `type`, `format`, `enum`, `default`, numeric or string constraints |
| Array       | `items`, length constraints, uniqueness                            |
| Object      | `properties`, `required`, `additionalProperties`, composition      |
| Composition | `allOf`, `oneOf`, `anyOf`, `not`, `discriminator`                  |

Operation types connect parameters, request bodies, responses, callbacks,
security, tags, and vendor extensions at one path and HTTP method.

## Extension and validation boundary

`Extensible` permits `x-*` properties without widening every known field.
Preserve extensions when transforming a document; generators may use them as a
contract. TypeScript assignment only checks compile-time shape. It does not
prove that loaded YAML or JSON is valid OpenAPI.

## Source and agent reference

- Public exports: [`packages/openapi/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts)
- Detailed agent API: [`skills/fetcher-openapi-types/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-openapi-types/references/api.md)
- Skill: [`$fetcher-openapi-types`](../skills/openapi-and-generation.md#fetcher-openapi-types)

Use `import type` so the package disappears from emitted JavaScript. These
interfaces describe document shape; validate untrusted JSON or YAML with a
dedicated validator before treating it as an `OpenAPI` object.

Use the [Generator reference](./generator.md) when the goal is client code,
not document tooling.
