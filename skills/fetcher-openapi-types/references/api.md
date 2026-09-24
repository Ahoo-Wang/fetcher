# Fetcher OpenAPI Types API Reference

## Contents

- [Package Overview](#package-overview)
- [All Exported Types](#all-exported-types)
  - [Document Structure](#document-structure)
  - [Schema Types](#schema-types)
  - [Operation Types](#operation-types)
  - [Parameter Types](#parameter-types)
  - [Response Types](#response-types)
  - [Security Types](#security-types)
  - [Components](#components)
  - [Reference & Utility Types](#reference--utility-types)
  - [Extension Types](#extension-types)
- [Quick Reference](#quick-reference)

The `@ahoo-wang/fetcher-openapi` package provides type-only source definitions for OpenAPI 3.x documents.

## Package Overview

- **npm:** `@ahoo-wang/fetcher-openapi`
- **Type:** TypeScript types only
- **OpenAPI Support:** The 3.x shapes represented by the exported interfaces
- **Client generation:** moved out of fetcher in 6.0; this package is only the type layer (see `$fetcher-v6-migration`)
- **Imports:** Single entry point — `import type { ... } from '@ahoo-wang/fetcher-openapi'`

## All Exported Types

### Document Structure

| Type                    | Description                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OpenAPI`               | Root OpenAPI document object                                                                                      |
| `Info`                  | API metadata (title, version, description, termsOfService, contact, license) — all optional here, unlike the spec |
| `Contact`               | Contact information (name, url, email)                                                                            |
| `License`               | License information (name, url)                                                                                   |
| `Server`                | Server configuration with URL template variables                                                                  |
| `ServerVariable`        | Variable substitution for server URLs (enum, default, description)                                                |
| `Paths`                 | Map of API paths to PathItem objects (plus `x-*` keys)                                                            |
| `PathItem`              | Per-path `get`…`trace` operations, `$ref`, `summary`, `servers`, `parameters`                                     |
| `Components`            | Reusable components (schemas, responses, parameters, and more)                                                    |
| `ComponentTypeMap`      | Maps each `Components` key to its non-reference interface (e.g. `schemas` → `Schema`)                             |
| `Tag`                   | API grouping and documentation tags                                                                               |
| `ExternalDocumentation` | External docs link (url, description)                                                                             |

```typescript
import type {
  OpenAPI,
  Server,
  ServerVariable,
  Components,
} from '@ahoo-wang/fetcher-openapi';

const doc: OpenAPI = {
  openapi: '3.0.1',
  info: { title: 'My API', version: '1.0.0' },
  servers: [
    {
      url: 'https://{env}.example.com/v1',
      variables: {
        env: { default: 'api', enum: ['api', 'staging'] } as ServerVariable,
      },
    },
  ],
  paths: {},
  components: {} as Components,
};
```

---

### Schema Types

| Type            | Description                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| `Schema`        | JSON Schema-based data structure definitions                                      |
| `SchemaType`    | `'string' \| 'number' \| 'integer' \| 'boolean' \| 'array' \| 'object' \| 'null'` |
| `Discriminator` | Polymorphism support with propertyName + mapping                                  |
| `XML`           | XML serialization configuration                                                   |

**Schema property categories:**

- **General:** `title`, `description`, `type` (`SchemaType | SchemaType[]`), `format`, `nullable`, `readOnly`, `writeOnly`, `deprecated`, `example`, `const`, `default`, `$schema`
- **Numeric:** `minimum`, `maximum`, `exclusiveMinimum` / `exclusiveMaximum` (`boolean | number`, 3.0 and 3.1 styles), `multipleOf`
- **String:** `minLength`, `maxLength`, `pattern`
- **Array:** `items` (Schema | Reference), `minItems`, `maxItems`, `uniqueItems`
- **Object:** `properties`, `required` (string[]), `minProperties`, `maxProperties`, `additionalProperties` (`boolean | Schema | Reference`)
- **Composition:** `allOf`, `anyOf`, `oneOf` (each: Array<Schema | Reference>); `not` is a single `Schema | Reference`
- **Enumeration:** `enum` (any[])
- **Polymorphism:** `discriminator` (Discriminator)
- **XML:** `xml` (XML)
- **Docs:** `externalDocs` (ExternalDocumentation)

```typescript
import type { Schema, Discriminator } from '@ahoo-wang/fetcher-openapi';

const userSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
  },
  required: ['id', 'name', 'email'],
};

// Polymorphic schema with discriminator
const polymorphicSchema: Schema = {
  oneOf: [
    { $ref: '#/components/schemas/Admin' },
    { $ref: '#/components/schemas/User' },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      admin: '#/components/schemas/Admin',
      user: '#/components/schemas/User',
    },
  },
};
```

---

### Operation Types

| Type          | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `Operation`   | Single API operation (GET, POST, PUT, DELETE, etc.)                                |
| `PathItem`    | Operations and parameters for a single path                                        |
| `RequestBody` | Request body definition with content types                                         |
| `MediaType`   | Content type definition: `schema`, `example`, `examples`, `encoding`               |
| `Encoding`    | Serialization rules: `contentType`, `headers`, `style`, `explode`, `allowReserved` |
| `Callback`    | Map of callback expressions to PathItem objects                                    |

**Operation properties:** `tags`, `summary`, `description`, `externalDocs`, `operationId`, `parameters`, `requestBody`, `responses` (required), `callbacks`, `deprecated`, `security`, `servers`

```typescript
import type {
  Operation,
  RequestBody,
  MediaType,
  Encoding,
} from '@ahoo-wang/fetcher-openapi';

const createUserOp: Operation = {
  operationId: 'createUser',
  summary: 'Create a new user',
  tags: ['users'],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/CreateUserRequest' },
      } as MediaType,
    },
  },
  responses: {
    '201': { description: 'User created' },
  },
  deprecated: false,
  security: [{ bearerAuth: [] }],
};
```

---

### Parameter Types

| Type                | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `Parameter`         | Operation parameter (query, path, header, cookie)                       |
| `ParameterLocation` | `'query' \| 'header' \| 'path' \| 'cookie'`                             |
| `Header`            | Follows Parameter structure: `schema`, `example`, `examples`, `content` |

**Parameter properties:** `name` (required), `in` (required), `description`, `required`, `deprecated`, `allowEmptyValue`, `style`, `explode`, `allowReserved`, `schema`, `example`, `examples`, `content`

```typescript
import type { Parameter, ParameterLocation } from '@ahoo-wang/fetcher-openapi';

const userIdParam: Parameter = {
  name: 'userId',
  in: 'path' as ParameterLocation,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'The user ID',
};
```

---

### Response Types

| Type        | Description                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `Response`  | Response definition: `description` (optional here), `headers`, `content`, `links`                     |
| `Responses` | `default` plus status-code keys, each `Response \| Reference`                                         |
| `Link`      | Design-time link: `operationRef`, `operationId`, `parameters`, `requestBody`, `description`, `server` |
| `Example`   | Example object: `summary`, `description`, `value`, `externalValue`                                    |

```typescript
import type { Response, Link } from '@ahoo-wang/fetcher-openapi';

const errorResponse: Response = {
  description: 'Error response',
  headers: {
    'X-Request-Id': { description: 'Request ID', schema: { type: 'string' } },
  },
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
  links: {
    GetOrder: {
      operationId: 'getOrder',
      parameters: { orderId: '$response.body#/id' },
    } as Link,
  },
};
```

---

### Security Types

| Type                  | Description                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `SecurityScheme`      | `type`: `'apiKey' \| 'http' \| 'oauth2' \| 'openIdConnect'`; plus `name`, `in`, `scheme`, `bearerFormat`, `flows`, `openIdConnectUrl` |
| `SecurityRequirement` | Map of scheme names to required scopes                                                                                                |
| `OAuthFlows`          | OAuth flow configs: implicit, password, clientCredentials, authorizationCode                                                          |
| `OAuthFlow`           | Single OAuth flow: authorizationUrl, tokenUrl, refreshUrl, `scopes` (required)                                                        |

```typescript
import type {
  SecurityScheme,
  SecurityRequirement,
} from '@ahoo-wang/fetcher-openapi';

const bearerScheme: SecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};

const securityReq: SecurityRequirement = {
  bearerAuth: [],
};
```

---

### Components

| Property          | Type                                          |
| ----------------- | --------------------------------------------- |
| `schemas`         | `Record<string, Schema \| Reference>`         |
| `responses`       | `Record<string, Response \| Reference>`       |
| `parameters`      | `Record<string, Parameter \| Reference>`      |
| `examples`        | `Record<string, Example \| Reference>`        |
| `requestBodies`   | `Record<string, RequestBody \| Reference>`    |
| `headers`         | `Record<string, Header \| Reference>`         |
| `securitySchemes` | `Record<string, SecurityScheme \| Reference>` |
| `links`           | `Record<string, Link \| Reference>`           |
| `callbacks`       | `Record<string, Callback \| Reference>`       |

---

### Reference & Utility Types

| Type             | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `Reference`      | JSON Reference with `$ref: string`                                                  |
| `IsReference<T>` | Utility type: `T extends { $ref: string } ? T : never`                              |
| `HTTPMethod`     | `'get' \| 'put' \| 'post' \| 'delete' \| 'options' \| 'head' \| 'patch' \| 'trace'` |

```typescript
import type {
  Reference,
  IsReference,
  HTTPMethod,
  SchemaType,
} from '@ahoo-wang/fetcher-openapi';

// Distinguish $ref from inline definitions (no runtime guard is exported).
// Do not use this on PathItem: it has its own optional `$ref` field.
function isRef<T extends object>(obj: T | Reference): obj is Reference {
  return '$ref' in obj;
}

const method: HTTPMethod = 'trace';
const primitive: SchemaType = 'null';
```

---

### Extension Types

| Type               | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `Extensible`       | `[extension: \`x-${string}\`]: any` — base for all OpenAPI objects                                |
| `CommonExtensions` | Predefined extensions: `x-internal`, `x-deprecated`, `x-tags`, `x-examples`, `x-order`, `x-group` |

```typescript
import type { Operation, CommonExtensions } from '@ahoo-wang/fetcher-openapi';

const operationWithExtensions: Operation & CommonExtensions = {
  summary: 'Get user profile',
  operationId: 'getUserProfile',
  responses: { '200': { description: 'OK' } },
  'x-internal': false,
  'x-deprecated': {
    message: 'Use getUser instead',
    since: '2.0.0',
    removedIn: '3.0.0',
    replacement: 'getUser',
  },
  'x-tags': ['users', 'profile'],
  'x-order': 1,
};
```

---

## Quick Reference

**Installation:**

```bash
npm install @ahoo-wang/fetcher-openapi
```

**All types from single entry point:**

```typescript
import type {
  OpenAPI,
  Info,
  Contact,
  License,
  Server,
  ServerVariable,
  Paths,
  PathItem,
  Operation,
  RequestBody,
  MediaType,
  Encoding,
  Parameter,
  ParameterLocation,
  Header,
  Response,
  Responses,
  Link,
  Example,
  Callback,
  Schema,
  SchemaType,
  Discriminator,
  XML,
  Components,
  ComponentTypeMap,
  SecurityScheme,
  SecurityRequirement,
  OAuthFlows,
  OAuthFlow,
  Tag,
  ExternalDocumentation,
  Reference,
  IsReference,
  HTTPMethod,
  Extensible,
  CommonExtensions,
} from '@ahoo-wang/fetcher-openapi';
```

**Key characteristics:**

- Pure type definitions — no runtime JavaScript (the built ESM file is empty); use `import type`
- Single entry point import (`@ahoo-wang/fetcher-openapi`)
- Object types extend `Extensible` for `x-*` extension support (exceptions: `Reference` and type aliases like `IsReference`/`ComponentTypeMap`)
- Framework agnostic — works with any TypeScript project
- Covers the OpenAPI 3.x shapes currently declared by this package, including discriminator, callbacks, and links
