---
title: 'Documents and operations'
description: 'Documents and operations — Fetcher 5.0.0'
---

# Documents and operations

Use these types to author an OpenAPI document or describe input to the [generator](../generator/). They describe data; they do not fetch a document, enforce the OpenAPI specification, or execute an operation.

## Document contract

| Type                              | Required fields and behavior                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OpenAPI`                         | `openapi: string`, `info: Info`, `paths: Paths`; optional servers, components, security, tags and externalDocs   |
| `Info`                            | All fields optional in this package, including title/version; this is less strict than a specification validator |
| `Contact`, `License`              | Contact fields optional; License requires name                                                                   |
| `Server`, `ServerVariable`        | Server requires url; variable requires default; no URL interpolation happens here                                |
| `Tag`, `ExternalDocumentation`    | Require name and url respectively; metadata only                                                                 |
| `Paths`, `PathItem`, `HTTPMethod` | Paths maps strings to items; eight lowercase method keys, shared parameters/servers, optional `$ref`             |
| `Operation`                       | Requires responses; optional operationId, tags, parameters, body, callbacks, security and servers                |

## Parameters and responses

`Parameter` requires `name` and `in` (`query`, `header`, `path`, `cookie`). All serialization hints (`style`, `explode`, `allowReserved`, `allowEmptyValue`) are optional; the package supplies no runtime defaults. It does not enforce path-parameter `required: true`, or mutual exclusion of schema/content and example/examples.

`RequestBody` requires a media-type-to-`MediaType` content map. `MediaType` can contain a Schema/Reference, examples, and per-property `Encoding`. `Header` has parameter-like fields without name/in. `Responses` maps string status keys to `Response | Reference | undefined`, with optional default. A Response's description is optional in these declarations. `Link` describes another operation by ID/ref; `Callback` maps runtime-expression strings to PathItem. None follows links, sends callbacks, negotiates content, or validates response status.

## Complete document

The following is a compile-time example with no network or resources to release. Type checking catches misspelled declared fields and incompatible values; external JSON still needs application-level validation.

```ts
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';

const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Items', version: '1.0.0' },
  tags: [{ name: 'Items' }],
  paths: {
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        tags: ['Items'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};
console.log(document.paths['/items/{id}'].get?.operationId);
```

### OpenAPI {#openapi}

[packages/openapi/src/openAPI.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/openAPI.ts#L41)

```ts
export interface OpenAPI extends Extensible {
  openapi: string;
  info: Info;
  servers?: Server[];
  paths: Paths;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}
```

### Contact {#contact}

[packages/openapi/src/info.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L27)

```ts
export interface Contact extends Extensible {
  name?: string;
  url?: string;
  email?: string;
}
```

### License {#license}

[packages/openapi/src/info.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L39)

```ts
export interface License extends Extensible {
  name: string;
  url?: string;
}
```

### Info {#info}

[packages/openapi/src/info.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/info.ts#L54)

```ts
export interface Info extends Extensible {
  title?: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version?: string;
}
```

### ServerVariable {#servervariable}

[packages/openapi/src/server.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/server.ts#L27)

```ts
export interface ServerVariable extends Extensible {
  enum?: string[];
  default: string;
  description?: string;
}
```

### Server {#server}

[packages/openapi/src/server.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/server.ts#L40)

```ts
export interface Server extends Extensible {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}
```

### Operation {#operation}

[packages/openapi/src/paths.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L44)

```ts
export interface Operation extends Extensible {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: Record<string, Callback | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}
```

### PathItem {#pathitem}

[packages/openapi/src/paths.ts:76](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L76)

```ts
export interface PathItem extends Extensible {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
}
```

### Paths {#paths}

[packages/openapi/src/paths.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/paths.ts#L95)

```ts
export interface Paths extends Extensible {
  [path: string]: PathItem;
}
```

### Parameter {#parameter}

[packages/openapi/src/parameters.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L40)

```ts
export interface Parameter extends Extensible {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}
```

### RequestBody {#requestbody}

[packages/openapi/src/parameters.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L63)

```ts
export interface RequestBody extends Extensible {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}
```

### MediaType {#mediatype}

[packages/openapi/src/parameters.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L77)

```ts
export interface MediaType extends Extensible {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}
```

### Encoding {#encoding}

[packages/openapi/src/parameters.ts:93](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/parameters.ts#L93)

```ts
export interface Encoding extends Extensible {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}
```

### Link {#link}

[packages/openapi/src/responses.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L35)

```ts
export interface Link extends Extensible {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}
```

### Response {#response}

[packages/openapi/src/responses.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L52)

```ts
export interface Response extends Extensible {
  description?: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}
```

### Responses {#responses}

[packages/openapi/src/responses.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L62)

```ts
export interface Responses extends Extensible {
  default?: Response | Reference;

  [httpCode: string]: Response | Reference | undefined;
}
```

### Callback {#callback}

[packages/openapi/src/responses.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/responses.ts#L71)

```ts
export interface Callback extends Extensible {
  [expression: string]: PathItem;
}
```

### Tag {#tag}

[packages/openapi/src/tags.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/tags.ts#L24)

```ts
export interface Tag extends Extensible {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}
```

### HTTPMethod {#httpmethod}

[packages/openapi/src/base-types.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L26)

```ts
export type HTTPMethod =
  'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
```

### ParameterLocation {#parameterlocation}

[packages/openapi/src/base-types.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L39)

```ts
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';
```

### ExternalDocumentation {#externaldocumentation}

[packages/openapi/src/base-types.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L59)

```ts
export interface ExternalDocumentation extends Extensible {
  description?: string;
  url: string;
}
```

### Example {#example}

[packages/openapi/src/base-types.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L72)

```ts
export interface Example extends Extensible {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}
```

### Header {#header}

[packages/openapi/src/base-types.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/base-types.ts#L82)

```ts
export interface Header extends Extensible {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}
```
