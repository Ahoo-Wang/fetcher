---
name: fetcher-openapi-types
description: >
  TypeScript type definitions for OpenAPI 3.0+ specifications with zero runtime dependencies. Covers OpenAPI, Info, Server, Paths, Operations, Schema (allOf/oneOf/anyOf, discriminator), Components (schemas, responses, parameters, securitySchemes, headers, links, callbacks, examples), Security, Tags, Extensions, IsReference utility type, and MediaType. Used by @ahoo-wang/fetcher-generator and @ahoo-wang/fetcher-viewer.
  Use for: OpenAPI types, JSON Schema, OpenAPI 3.1, $ref, discriminator, Extensible, components, paths, operations, type definitions, zero dependencies, OpenAPI specification types.
---

# fetcher-openapi-types

Skill for the `@ahoo-wang/fetcher-openapi` package — a pure type-only library providing complete TypeScript type definitions for OpenAPI 3.0+ specifications.

## Package Overview

- **npm:** `@ahoo-wang/fetcher-openapi`
- **Size:** ~2KB (zero runtime overhead)
- **Type:** TypeScript types only (no runtime JavaScript)
- **OpenAPI Support:** 3.0+
- **Consumed by:** `@ahoo-wang/fetcher-generator` (code generation), `@ahoo-wang/fetcher-viewer` (API documentation UI)
- **Imports:** Single entry point — `import type { ... } from '@ahoo-wang/fetcher-openapi'`

## When to Use This Skill

Use this skill when the user:

- Wants TypeScript types for OpenAPI specifications
- Mentions OpenAPI schema, operations, parameters, or responses
- Asks about type-safe OpenAPI definitions
- Needs to validate or manipulate OpenAPI documents in TypeScript
- Wants to understand the type system behind fetcher-generated clients

---

## All Exported Types

### Document Structure

| Type                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `OpenAPI`              | Root OpenAPI document object                                           |
| `Info`                 | API metadata (title, version, description, termsOfService, contact, license) |
| `Contact`              | Contact information (name, url, email)                                 |
| `License`              | License information (name, url)                                        |
| `Server`               | Server configuration with URL template variables                       |
| `ServerVariable`       | Variable substitution for server URLs (enum, default, description)     |
| `Paths`                | Map of API paths to PathItem objects                                   |
| `PathItem`             | Operations available on a single path (get, post, put, delete, etc.)   |
| `Components`           | Reusable components (schemas, responses, parameters, and more)         |
| `ComponentTypeMap`     | Maps component type names to their interfaces                          |
| `Tag`                  | API grouping and documentation tags                                    |
| `ExternalDocumentation`| External docs link (url, description)                                  |

```typescript
import type { OpenAPI, Server, ServerVariable, Components } from '@ahoo-wang/fetcher-openapi';

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

| Type            | Description                                    |
| --------------- | ---------------------------------------------- |
| `Schema`        | JSON Schema-based data structure definitions   |
| `SchemaType`    | `'string' \| 'number' \| 'integer' \| 'boolean' \| 'array' \| 'object' \| 'null'` |
| `Discriminator` | Polymorphism support with propertyName + mapping |
| `XML`           | XML serialization configuration                |

**Schema property categories:**

- **General:** `title`, `description`, `type`, `format`, `nullable`, `readOnly`, `writeOnly`, `deprecated`, `example`, `const`, `default`, `$schema`
- **Numeric:** `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`
- **String:** `minLength`, `maxLength`, `pattern`
- **Array:** `items` (Schema | Reference), `minItems`, `maxItems`, `uniqueItems`
- **Object:** `properties`, `required`, `minProperties`, `maxProperties`, `additionalProperties`
- **Composition:** `allOf`, `anyOf`, `oneOf`, `not` (each: Array<Schema | Reference>)
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

| Type          | Description                                         |
| ------------- | --------------------------------------------------- |
| `Operation`   | Single API operation (GET, POST, PUT, DELETE, etc.) |
| `PathItem`    | Operations and parameters for a single path         |
| `RequestBody` | Request body definition with content types          |
| `MediaType`   | Content type definition: `schema`, `example`, `examples`, `encoding` |
| `Encoding`    | Serialization rules: `contentType`, `headers`, `style`, `explode`, `allowReserved` |
| `Callback`    | Map of callback expressions to PathItem objects     |

**Operation properties:** `tags`, `summary`, `description`, `externalDocs`, `operationId`, `parameters`, `requestBody`, `responses` (required), `callbacks`, `deprecated`, `security`, `servers`

```typescript
import type {
  Operation, RequestBody, MediaType, Encoding,
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

| Type                | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `Parameter`         | Operation parameter (query, path, header, cookie)                |
| `ParameterLocation` | `'query' \| 'header' \| 'path' \| 'cookie'`                     |
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

| Type        | Description                                        |
| ----------- | -------------------------------------------------- |
| `Response`  | Response definition: `description`, `headers`, `content`, `links` |
| `Responses` | Map of HTTP status codes to Response objects        |
| `Link`      | Design-time link: `operationRef`, `operationId`, `parameters`, `requestBody`, `server` |
| `Example`   | Example object: `summary`, `description`, `value`, `externalValue` |

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

| Type                  | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `SecurityScheme`      | Auth scheme: `apiKey`, `http`, `oauth2`, `openIdConnect`          |
| `SecurityRequirement` | Map of scheme names to required scopes                            |
| `OAuthFlows`          | OAuth flow configs: implicit, password, clientCredentials, authorizationCode |
| `OAuthFlow`           | Single OAuth flow: authorizationUrl, tokenUrl, refreshUrl, scopes |

```typescript
import type {
  SecurityScheme, SecurityRequirement,
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

| Property           | Type                                  |
| ------------------ | ------------------------------------- |
| `schemas`          | `Record<string, Schema>`              |
| `responses`        | `Record<string, Response>`            |
| `parameters`       | `Record<string, Parameter>`           |
| `examples`         | `Record<string, Example \| Reference>` |
| `requestBodies`    | `Record<string, RequestBody>`         |
| `headers`          | `Record<string, Header \| Reference>` |
| `securitySchemes`  | `Record<string, SecurityScheme>`      |
| `links`            | `Record<string, Link>`                |
| `callbacks`        | `Record<string, Callback>`            |

---

### Reference & Utility Types

| Type            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `Reference`     | JSON Reference with `$ref: string`                               |
| `IsReference<T>`| Utility type: `T extends { $ref: string } ? T : never`          |
| `HTTPMethod`    | `'get' \| 'put' \| 'post' \| 'delete' \| 'options' \| 'head' \| 'patch' \| 'trace'` |

```typescript
import type { Reference, IsReference, HTTPMethod, SchemaType } from '@ahoo-wang/fetcher-openapi';

// Distinguish $ref from inline definitions
type ResolvedOrRef<T> = T | Reference;
function isRef<T>(obj: T | Reference): obj is Reference {
  return '$ref' in obj;
}

const method: HTTPMethod = 'trace';
const primitive: SchemaType = 'null';
```

---

### Extension Types

| Type                  | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `Extensible`          | `[extension: \`x-${string}\`]: any` — base for all OpenAPI objects |
| `CommonExtensions`    | Predefined extensions: `x-internal`, `x-deprecated`, `x-tags`, `x-examples`, `x-order`, `x-group` |

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
  OpenAPI, Info, Contact, License, Server, ServerVariable,
  Paths, PathItem, Operation, RequestBody, MediaType, Encoding,
  Parameter, ParameterLocation, Header, Response, Responses,
  Link, Example, Callback,
  Schema, SchemaType, Discriminator, XML,
  Components, ComponentTypeMap,
  SecurityScheme, SecurityRequirement, OAuthFlows, OAuthFlow,
  Tag, ExternalDocumentation, Reference, IsReference,
  HTTPMethod, Extensible, CommonExtensions,
} from '@ahoo-wang/fetcher-openapi';
```

**Key characteristics:**

- Pure type definitions — no runtime JavaScript, zero bundle size
- Single entry point import (`@ahoo-wang/fetcher-openapi`)
- All types extend `Extensible` for `x-*` extension support
- Framework agnostic — works with any TypeScript project
- Full OpenAPI 3.0+ support including discriminator, callbacks, links
