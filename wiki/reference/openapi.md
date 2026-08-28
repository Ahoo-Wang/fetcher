---
title: OpenAPI reference
description: Type OpenAPI 3.x documents, references, extensions, and schemas without runtime code.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-openapi`

`@ahoo-wang/fetcher-openapi` is a type-only vocabulary for authoring or transforming OpenAPI documents. It does not load, validate, dereference, or generate a document.

## Install and entry points

```bash
pnpm add -D @ahoo-wang/fetcher-openapi
```

Use `import type`: all types are re-exported by [`packages/openapi/src/index.ts:19`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19), with no runtime value. Use the [Generator reference](./generator.md) for client generation and a dedicated validator before trusting JSON/YAML.

| Need | Start with | Contract |
| --- | --- | --- |
| Root document | `OpenAPI`, `Info`, `Server`, `Tag` | `openapi`, `info`, and `paths` are required. |
| Route | `Paths`, `PathItem`, `Operation` | An operation requires `responses`. |
| Request | `Parameter`, `RequestBody`, `MediaType`, `Encoding` | Parameter needs `name`/`in`; request body needs `content`. |
| Result/callback | `Responses`, `Response`, `Header`, `Link`, `Callback` | Result entries may be inline or `$ref`. |
| Components | `Components`, `Schema`, `Reference` | Preserve each `Schema | Reference` union. |
| Auth/extension | `SecurityScheme`, `SecurityRequirement`, `Extensible` | `x-*` is allowed; its meaning is application-defined. |

## Export map

| Family | Public types |
| --- | --- |
| Base/document | `HTTPMethod`, `ParameterLocation`, `SchemaType`, `ExternalDocumentation`, `Example`, `Header`, `OpenAPI`, `Info`, `Contact`, `License`, `Server`, `ServerVariable`, `Tag` |
| Paths | `Paths`, `PathItem`, `Operation` |
| Inputs/outputs | `Parameter`, `RequestBody`, `MediaType`, `Encoding`, `Responses`, `Response`, `Link`, `Callback` |
| Components/schema | `Components`, `ComponentTypeMap`, `Schema`, `Discriminator`, `XML` |
| Security | `OAuthFlow`, `OAuthFlows`, `SecurityScheme`, `SecurityRequirement` |
| Reference/extension | `Reference`, `IsReference<T>`, `Extensible`, `CommonExtensions` |

## Minimal typed document

```ts
import type { OpenAPI, Operation, Reference, Schema } from '@ahoo-wang/fetcher-openapi';

const page: Schema = {
  type: 'object',
  required: ['total'],
  properties: { total: { type: 'integer', format: 'int64' } },
};

const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Catalog', version: '1.0.0' },
  paths: {
    '/products/{id}': {
      get: {
        operationId: 'getProduct',
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
  components: { schemas: { Page: page } },
};

function isReference(value: Schema | Reference): value is Reference {
  return '$ref' in value;
}

const operation: Operation = document.paths['/products/{id}'].get!;
```

`OpenAPI` requires only `openapi`, `info`, and `paths`; `servers`, `components`, global `security`, `tags`, and `externalDocs` are optional ([`openAPI.ts:41`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)). `PathItem` exposes eight HTTP-method keys and `Operation.responses` is required ([`paths.ts:44`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L44)).

## Type contracts

| Type | Required | Important branches |
| --- | --- | --- |
| `Parameter` | `name`, `in` | `schema` or `content`; both may contain references. |
| `RequestBody` | `content` | `Operation.requestBody` is `RequestBody | Reference`. |
| `Responses` | — | `default` and status keys are `Response | Reference | undefined`. |
| `Schema` | — | Constraints, `items`, `properties`, `additionalProperties`, composition, `discriminator`, `xml`. |
| `Components` | — | Maps schemas, responses, parameters, examples, request bodies, headers, security schemes, links, callbacks. |
| `SecurityScheme` | `type` | `apiKey`, `http`, `oauth2`, `openIdConnect`; each OAuth flow requires `scopes`. |
| `Callback` | — | Expression keys map to `PathItem`. |

The public `$ref` shape is `Reference` (`{ $ref: string }`), not `ReferenceObject`. Narrow every `Schema | Reference`, `Response | Reference`, or similar union before reading inline fields ([`reference.ts:23`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/reference.ts#L23)). `Operation` uses reference unions for parameters, request bodies, and callbacks; `Responses` does so for response entries ([`paths.ts:50`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L50), [`responses.ts:62`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L62)).

## OpenAPI 3.0 / 3.1 boundary

`OpenAPI.openapi` is an unconstrained `string`: the package does not select, validate, or convert an OpenAPI version. `Schema` admits common 3.0 fields such as `nullable` and 3.1/JSON-Schema-oriented fields such as `$schema`, `const`, `type: 'null'`, numeric exclusive bounds, and a type array. This is a permissive shape, not proof of 3.0 or 3.1 compliance ([`schema.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L91)).

Every extensible object accepts `x-${string}`. `CommonExtensions` is a convenience list, not a restriction on all vendor extensions ([`extensions.ts:22`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/extensions.ts#L22)).

## Failure guide

| Symptom | Check |
| --- | --- |
| A field is rejected | Check the exact interface; this package does not model every dialect extension. |
| Cannot read `properties` or `content` | Narrow the `Reference` union first. |
| JSON/YAML type-checks but tooling fails | Validate and dereference separately; there is no parser or runtime validator. |
| Extension is rejected | Use an `x-` key; arbitrary unknown keys are not allowed. |
| Need 3.1 compliance | Add a version-aware validator. |

## Source reference

- [Public exports: `packages/openapi/src/index.ts:19`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L19)
- [Document root: `packages/openapi/src/openAPI.ts:41`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)
- [Inputs: `packages/openapi/src/parameters.ts:40`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L40)
- [Schema: `packages/openapi/src/schema.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/schema.ts#L91)
- [Security: `packages/openapi/src/security.ts:63`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L63)
