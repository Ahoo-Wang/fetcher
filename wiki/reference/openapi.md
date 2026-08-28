---
title: OpenAPI reference
description: Type OpenAPI documents and extensions without adding runtime code.
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

Use `import type` so the package disappears from emitted JavaScript. These
interfaces describe document shape; validate untrusted JSON or YAML with a
dedicated validator before treating it as an `OpenAPI` object.

Use the [Generator reference](./generator.md) when the goal is client code,
not document tooling.
