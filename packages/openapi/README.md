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