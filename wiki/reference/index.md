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

The integration references cover React hooks, OpenAPI types and generation,
OpenAI streaming, Wow CQRS, CoSec authentication, and the Viewer component
library. Until then, use [Choose packages](../start/choose-packages.md) to pick
the right entry point and the [recipes](../recipes/declarative-services.md) for
end-to-end examples.

## Reading conventions

- **Default** means the behavior used when you omit the option.
- APIs shown here are public exports from the package entry point.
- Examples prefer the smallest production-shaped path; exhaustive types remain
  available in the generated TypeScript declarations.
