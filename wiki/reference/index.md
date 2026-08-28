---
title: Package reference
description: Choose a Fetcher package by responsibility, then open its focused API reference.
---

# Package reference

Fetcher is split into small packages so applications only install the runtime
capabilities they use. Start with `@ahoo-wang/fetcher`; add another package when
the responsibility in the table becomes part of your application.

## Core packages

| Package                          | Use it for                                                   | Reference                        |
| -------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| `@ahoo-wang/fetcher`             | HTTP requests, interceptors, timeouts, and result extraction | [Fetcher](./fetcher.md)          |
| `@ahoo-wang/fetcher-decorator`   | Class-based declarative API services                         | [Decorator](./decorator.md)      |
| `@ahoo-wang/fetcher-eventbus`    | Typed in-process or cross-tab events                         | [Event bus](./eventbus.md)       |
| `@ahoo-wang/fetcher-eventstream` | Server-Sent Events and streaming responses                   | [Event stream](./eventstream.md) |
| `@ahoo-wang/fetcher-storage`     | Typed values backed by browser or in-memory storage          | [Storage](./storage.md)          |

## Integration packages

| Package                        | Use it for                                               | Reference                   |
| ------------------------------ | -------------------------------------------------------- | --------------------------- |
| `@ahoo-wang/fetcher-react`     | React request state, query hooks, storage, and guards    | [React](./react.md)         |
| `@ahoo-wang/fetcher-openapi`   | TypeScript types for OpenAPI documents                   | [OpenAPI](./openapi.md)     |
| `@ahoo-wang/fetcher-generator` | Generate typed clients from OpenAPI                      | [Generator](./generator.md) |
| `@ahoo-wang/fetcher-openai`    | Chat Completions with typed streaming                    | [OpenAI](./openai.md)       |
| `@ahoo-wang/fetcher-wow`       | Wow commands, queries, filters, and aggregation          | [Wow](./wow.md)             |
| `@ahoo-wang/fetcher-cosec`     | CoSec headers, tokens, refresh, and authorization errors | [CoSec](./cosec.md)         |

The Viewer component library has a separate reference because its public API
is organized around UI composition rather than request infrastructure.

## Reading conventions

- **Default** means the behavior used when you omit the option.
- APIs shown here are public exports from the package entry point.
- Examples prefer the smallest production-shaped path; exhaustive types remain
  available in the generated TypeScript declarations.
