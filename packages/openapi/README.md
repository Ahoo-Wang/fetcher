# @ahoo-wang/fetcher-openapi

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-openapi.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

OpenAPI Specification TypeScript types and utilities for [Fetcher](https://github.com/Ahoo-Wang/fetcher) - A modern,
ultra-lightweight HTTP client.

## Features

- 📦 **Ultra-lightweight** - Zero runtime overhead, TypeScript types only (~2KB)
- 🦺 **Full TypeScript Support** - Complete type definitions for OpenAPI 3.0+ specification
- 🧩 **Modular Design** - Import only what you need from specific modules
- 🎯 **Framework Agnostic** - Works with any OpenAPI-compatible tooling
- 🔧 **Extension Support** - Built-in support for OpenAPI extensions (x-\* properties)
- 📚 **Comprehensive Coverage** - All OpenAPI 3.0+ features including schemas, parameters, responses, security, etc.
- 🏗️ **Type-Safe Development** - Leverage TypeScript's type system for API development

## Installation

```bash
npm install @ahoo-wang/fetcher-openapi
```

## Usage

### Basic Types

Import OpenAPI specification types:

```typescript
import type {
  OpenAPI,
  Schema,
  Operation,
  Components,
} from '@ahoo-wang/fetcher-openapi';

const openAPI: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        operationId: 'getUsers',
        responses: {
          '200': {
            description: 'A list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name'],
      },
    },
  },
};
```

### Working with Schemas

Define complex data structures with full OpenAPI Schema support:

```typescript
import type { Schema, Discriminator, XML } from '@ahoo-wang/fetcher-openapi';

const userSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email'],
};

const polymorphicSchema: Schema = {
  oneOf: [
    { $ref: '#/components/schemas/Admin' },
    { $ref: '#/components/schemas/User' },
  ],
  discriminator: {
    propertyName: 'role',
    mapping: {
      admin: '#/components/schemas/Admin',
      user: '#/components/schemas/User',
    },
  },
};
```

### Extensions Support

Use OpenAPI extensions for custom functionality:

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
  responses: {
    '200': {
      description: 'User profile',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UserProfile' },
        },
      },
    },
  },
};
```

## API Reference

### Core Types

#### Document Structure

- `OpenAPI` - Root OpenAPI document object
- `Info` - API metadata (title, version, description, etc.)
- `Contact` - Contact information for the API
- `License` - License information
- `Server` - Server configuration with variables
- `Paths` - Collection of API paths and their operations
- `Components` - Reusable components (schemas, parameters, responses, etc.)
- `Tag` - API grouping and documentation tags

#### Operations & Parameters

- `Operation` - Single API operation (GET, POST, etc.)
- `Parameter` - Operation parameter (query, path, header, cookie)
- `RequestBody` - Request body definition with content types
- `Response` - Response definition with status codes
- `MediaType` - Content type definitions with schemas
- `Encoding` - Serialization rules for request/response bodies

#### Data Schemas

- `Schema` - JSON Schema-based data structure definitions
- `Discriminator` - Polymorphism support with discriminator fields
- `XML` - XML serialization configuration
- `Reference` - JSON Reference ($ref) for reusable components

#### Security

- `SecurityScheme` - Authentication scheme definitions
- `SecurityRequirement` - Required security schemes for operations

### Extensions & Utilities

#### Extension Support

- `Extensible` - Base interface for objects supporting extensions
- `CommonExtensions` - Predefined extension properties (x-internal, x-deprecated, etc.)

#### Type Utilities

- `HTTPMethod` - Supported HTTP methods ('get', 'post', 'put', 'delete', etc.)
- `ParameterLocation` - Parameter locations ('query', 'header', 'path', 'cookie')
- `SchemaType` - JSON Schema primitive types ('string', 'number', 'boolean', etc.)

### Advanced Usage

#### Modular Imports

Import only the types you need for better tree-shaking:

```typescript
// Import specific types
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

// Or import from specific modules
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi/openAPI';
import type { Schema } from '@ahoo-wang/fetcher-openapi/schema';
import type { Operation } from '@ahoo-wang/fetcher-openapi/paths';
```

#### Type-Safe API Development

Use these types to build type-safe API clients and documentation:

```typescript
function validateOpenAPI(doc: OpenAPI): boolean {
  // TypeScript will catch type errors at compile time
  return doc.openapi.startsWith('3.');
}

function createOperation(
  path: string,
  method: HTTPMethod,
  config: Partial<Operation>,
): Operation {
  return {
    operationId: `${method}${path.replace(/\//g, '')}`,
    ...config,
  };
}
```

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)
