# @ahoo-wang/fetcher-openapi

[![NPM Version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![NPM Downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-openapi)](https://www.npmjs.com/package/@ahoo-wang/fetcher-openapi)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-openapi)](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)

English | [简体中文](./README.zh-CN.md)

OpenAPI Specification TypeScript types and utilities for [Fetcher](https://github.com/Ahoo-Wang/fetcher) - A modern,
ultra-lightweight HTTP client.

## Features

- 📦 **Ultra-lightweight** - Minimal overhead TypeScript types only
- 🦺 **Full TypeScript Support** - Complete type definitions for OpenAPI 3.x specification
- 🔍 **Type Inference Utilities** - Extract TypeScript types from OpenAPI schemas
- 🔄 **Reference Resolution** - Resolve $ref references in OpenAPI documents
- 🧩 **Modular Design** - Import only what you need
- 🎯 **Framework Agnostic** - Works with any OpenAPI-compatible tooling

## Installation

```bash
npm install @ahoo-wang/fetcher-openapi
```

## Usage

### Basic Types

Import OpenAPI specification types:

```typescript
import type { OpenAPI, Schema, Operation } from '@ahoo-wang/fetcher-openapi';

const openAPI: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0'
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        responses: {
          '200': {
            description: 'A list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
```

### Type Inference Utilities

The package provides powerful type inference utilities to extract TypeScript types from OpenAPI schemas:

```typescript
import type {
  ExtractSchemaType,
  ExtractRequestBodyType,
  ExtractOkResponseBodyType
} from '@ahoo-wang/fetcher-openapi';

// Extract type from schema
type User = ExtractSchemaType<{
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' }
  },
  required: ['id', 'name']
}>;

// Extract request body type from operation
type CreateUserRequest = ExtractRequestBodyType<{
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        }
      }
    }
  }
}>;

// Extract response body type from operation
type CreateUserResponse = ExtractOkResponseBodyType<{
  responses: {
    '201': {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User'
          }
        }
      }
    }
  }
}, {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }
  }
}>;
```

## Advanced Type Inference

### Handling Complex Schema Types

The type inference utilities support complex OpenAPI schema constructs:

```typescript
import type { ExtractSchemaType } from '@ahoo-wang/fetcher-openapi';

// Union types with oneOf
type UnionType = ExtractSchemaType<{
  oneOf: [
    { type: 'string' },
    { type: 'number' }
  ]
}>; // string | number

// Intersection types with allOf
type IntersectionType = ExtractSchemaType<{
  allOf: [
    {
      type: 'object',
      properties: { id: { type: 'number' } },
      required: ['id']
    },
    {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name']
    }
  ]
}>; // { id: number } & { name: string }

// Array types
type ArrayType = ExtractSchemaType<{
  type: 'array',
  items: { type: 'string' }
}>; // string[]
```

### Resolving References

The package also provides utilities for resolving `$ref` references:

```typescript
import type { ResolveReference } from '@ahoo-wang/fetcher-openapi';

type Resolved = ResolveReference<
  { $ref: '#/components/schemas/User' },
  {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      }
    }
  }
>; // { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' } }, required: ['id', 'name'] }
```

## API Reference

### Core Types

- `OpenAPI` - Root document object
- `Info` - API metadata
- `Server` - Server configuration
- `Paths` - API paths and operations
- `Operation` - Single API operation
- `Schema` - Data schema definition
- `Parameter` - Operation parameter
- `RequestBody` - Request body definition
- `Response` - Response definition
- `Components` - Reusable components
- `SecurityScheme` - Security scheme definition

### Utility Types

- `ExtractSchemaType<S>` - Extract TypeScript type from OpenAPI Schema
- `ExtractRequestBodyType<Op, Components>` - Extract request body type from Operation
- `ExtractOkResponseBodyType<Op, Components>` - Extract successful response body type from Operation
- `ResolveReference<R, Components>` - Resolve $ref references to actual types

## License

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)