---
name: fetcher-openapi-types
description: Use TypeScript types for OpenAPI 3.0+ specifications. Use when users want OpenAPI types, mentions fetcher-openapi package, or needs type definitions for OpenAPI specs.
---

# fetcher-openapi-types

Skill for the `@ahoo-wang/fetcher-openapi` package — a pure type-only library providing complete TypeScript type definitions for OpenAPI 3.0+ specifications.

## Package Overview

- **npm:** `@ahoo-wang/fetcher-openapi`
- **Size:** ~2KB (zero runtime overhead)
- **Type:** TypeScript types only (no runtime JavaScript)
- **OpenAPI Support:** 3.0+

## When to Use This Skill

Use this skill when the user:
- Wants TypeScript types for OpenAPI specifications
- Mentions OpenAPI schema, operations, parameters, or responses
- Asks about type-safe OpenAPI definitions
- Needs to validate or manipulate OpenAPI documents in TypeScript
- Wants to understand the type system behind fetcher-generated clients

---

## Core Types

### OpenAPI Document Structure

| Type | Description |
|------|-------------|
| `OpenAPI` | Root OpenAPI document object |
| `Info` | API metadata (title, version, description) |
| `Contact` | Contact information for the API |
| `License` | License information |
| `Server` | Server configuration with variables |
| `Paths` | Collection of API paths and their operations |
| `Components` | Reusable components (schemas, parameters, responses, security schemes) |
| `Tag` | API grouping and documentation tags |

```typescript
import type { OpenAPI, Components } from '@ahoo-wang/fetcher-openapi';

const doc: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  paths: {},
  components: {} as Components,
};
```

---

### Schema Types

| Type | Description |
|------|-------------|
| `Schema` | JSON Schema-based data structure definitions |
| `Discriminator` | Polymorphism support with discriminator fields |
| `XML` | XML serialization configuration |
| `Reference` | JSON Reference ($ref) for reusable components |

**Schema properties include:**
- `type` — Primitive types: `string`, `number`, `boolean`, `integer`, `array`, `object`
- `format` — Formats: `date-time`, `email`, `uuid`, etc.
- `properties` — Object property definitions
- `items` — Array item schema
- `required` — Required property names
- `enum` — Enumeration values
- `minimum`, `maximum`, `minLength`, `maxLength` — Constraints
- `oneOf`, `allOf`, `anyOf` — Composition
- `$ref` — Reference to another schema

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

| Type | Description |
|------|-------------|
| `Operation` | Single API operation (GET, POST, PUT, DELETE, etc.) |
| `RequestBody` | Request body definition with content types |
| `MediaType` | Content type definitions with schemas |
| `Encoding` | Serialization rules for request/response bodies |

**Operation properties include:**
- `operationId` — Unique operation identifier
- `summary`, `description` — Documentation
- `parameters` — Query, path, header, cookie parameters
- `requestBody` — Request body content
- `responses` — Response definitions by status code
- `tags` — Grouping tags
- `security` — Security requirements
- `deprecated` — Deprecation flag

```typescript
import type { Operation, RequestBody, MediaType } from '@ahoo-wang/fetcher-openapi';

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
    '201': {
      description: 'User created',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
};
```

---

### Parameter Types

| Type | Description |
|------|-------------|
| `Parameter` | Operation parameter (query, path, header, cookie) |
| `ParameterLocation` | Parameter locations: `'query'`, `'header'`, `'path'`, `'cookie'` |

**Parameter properties include:**
- `name` — Parameter name
- `in` — Location: query, header, path, cookie
- `required` — Whether the parameter is required
- `schema` — Parameter schema definition
- `description` — Documentation

```typescript
import type { Parameter, ParameterLocation } from '@ahoo-wang/fetcher-openapi';

const userIdParam: Parameter = {
  name: 'userId',
  in: 'path' as ParameterLocation,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'The user ID',
};

const searchParam: Parameter = {
  name: 'search',
  in: 'query' as ParameterLocation,
  schema: { type: 'string', minLength: 1 },
};
```

---

### Response Types

| Type | Description |
|------|-------------|
| `Response` | Response definition with status codes |
| `MediaType` | Content type with schema |

```typescript
import type { Response } from '@ahoo-wang/fetcher-openapi';

const errorResponse: Response = {
  description: 'Error response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};
```

---

### Security Types

| Type | Description |
|------|-------------|
| `SecurityScheme` | Authentication scheme definitions (API key, Bearer, OAuth2, etc.) |
| `SecurityRequirement` | Required security schemes for operations |

**Security scheme types include:**
- `apiKey` — API key authentication
- `http` — HTTP authentication (Bearer, Basic)
- `oauth2` — OAuth 2.0 flows
- `openIdConnect` — OpenID Connect

```typescript
import type { SecurityScheme, SecurityRequirement } from '@ahoo-wang/fetcher-openapi';

const bearerScheme: SecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};

const apiKeyScheme: SecurityScheme = {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
};

const securityReq: SecurityRequirement = {
  bearerAuth: [],
  apiKeyAuth: ['write:users'],
};
```

---

## Extension Types

### Extensible

All OpenAPI objects support custom extensions via `x-*` properties.

```typescript
import type { Extensible } from '@ahoo-wang/fetcher-openapi';
```

### CommonExtensions

Predefined extension types for common metadata:

```typescript
import type { Operation, CommonExtensions } from '@ahoo-wang/fetcher-openapi';

const operationWithExtensions: Operation & CommonExtensions = {
  summary: 'Get user profile',
  operationId: 'getUserProfile',
  'x-internal': false,
  'x-deprecated': {
    message: 'Use getUser instead',
    since: '2.0.0',
    removedIn: '3.0.0',
    replacement: 'getUser',
  },
  'x-tags': ['users', 'profile'],
  'x-order': 1,
  responses: { '200': { description: 'OK' } },
};
```

---

## Type Utilities

| Type | Description |
|------|-------------|
| `HTTPMethod` | `'get'`, `'post'`, `'put'`, `'delete'`, `'patch'`, `'options'`, `'head'` |
| `ParameterLocation` | `'query'`, `'header'`, `'path'`, `'cookie'` |
| `SchemaType` | JSON Schema primitive types |

```typescript
import type { HTTPMethod, ParameterLocation, SchemaType } from '@ahoo-wang/fetcher-openapi';

const method: HTTPMethod = 'post';
const location: ParameterLocation = 'query';
const schemaType: SchemaType = 'string';
```

---

## Modular Imports

Import only the types you need for better tree-shaking:

```typescript
// From main entry
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

// From specific modules
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi/openapi';
import type { Schema } from '@ahoo-wang/fetcher-openapi/schema';
import type { Operation } from '@ahoo-wang/fetcher-openapi/paths';
import type { Parameter } from '@ahoo-wang/fetcher-openapi/parameter';
import type { Response } from '@ahoo-wang/fetcher-openapi/response';
import type { SecurityScheme } from '@ahoo-wang/fetcher-openapi/security';
```

---

## Integration with fetcher-generator

The `@ahoo-wang/fetcher-openapi` types work seamlessly with `@ahoo-wang/fetcher-generator`:

1. **Generated clients** use these types internally for type-safe operation definitions
2. **Custom OpenAPI manipulation** — validate or transform OpenAPI documents before code generation
3. **Schema validation** — ensure custom schemas conform to OpenAPI spec
4. **Documentation tools** — build documentation generators with full type safety

```typescript
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

// Validate OpenAPI document structure
function validateOpenAPI(doc: unknown): doc is OpenAPI {
  const api = doc as OpenAPI;
  return (
    typeof api === 'object' &&
    api !== null &&
    'openapi' in api &&
    typeof api.openapi === 'string' &&
    api.openapi.startsWith('3.')
  );
}

// Check if schema is polymorphic
function isPolymorphic(schema: Schema): boolean {
  return !!(schema.oneOf || schema.allOf || schema.anyOf || schema.discriminator);
}

// Extract all operationIds from an OpenAPI document
function getOperationIds(doc: OpenAPI): string[] {
  const ids: string[] = [];
  for (const path of Object.values(doc.paths)) {
    for (const operation of Object.values(path)) {
      if ('operationId' in operation && operation.operationId) {
        ids.push(operation.operationId);
      }
    }
  }
  return ids;
}
```

---

## Quick Reference

**Installation:**
```bash
npm install @ahoo-wang/fetcher-openapi
```

**Import everything:**
```typescript
import type {
  OpenAPI,
  Schema,
  Operation,
  Parameter,
  Response,
  Components,
  SecurityScheme,
  SecurityRequirement,
  Discriminator,
  RequestBody,
  MediaType,
  HTTPMethod,
  ParameterLocation,
} from '@ahoo-wang/fetcher-openapi';
```

**Key characteristics:**
- Pure type definitions — no runtime JavaScript
- Zero bundle size impact when using TypeScript
- Framework agnostic
- Modular imports for tree-shaking
- Full OpenAPI 3.0+ support including extensions
