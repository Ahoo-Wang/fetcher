---
prev: false
next: false
title: Find the API for your task
description: Find the API for your task
pageClass: reference-index-page
---

# Find the API for your task

Each package has an entry page and focused reference topics. Choose the responsibility first, then the API family. Complex packages have deeper navigation; small packages stay compact.

| Package                                   | Responsibility             | Topics |
| ----------------------------------------- | -------------------------- | ------ |
| [fetcher](./fetcher/index.md)             | HTTP requests              | 6      |
| [decorator](./decorator/index.md)         | Declarative services       | 3      |
| [eventbus](./eventbus/index.md)           | Event delivery             | 2      |
| [eventstream](./eventstream/index.md)     | SSE consumption            | 3      |
| [storage](./storage/index.md)             | Stored values              | 2      |
| [openapi](./openapi/index.md)             | OpenAPI type contracts     | 3      |
| [generator](./generator/index.md) (5.x)   | Generated clients          | 5      |
| [openai](./openai/index.md)               | Chat and token streams     | 2      |
| [cosec](./cosec/index.md)                 | Authentication and refresh | 3      |
| [react](./react/index.md)                 | Component request state    | 7      |
| [wow](./wow/index.md) (5.x)               | Commands and queries       | 9      |
| [viewer](./viewer/index.md) (5.x, frozen) | Data views and persistence | 8      |

Packages marked 5.x apply only to the 5.x line (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)). From 6.0, Wow and the generator live in the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) ([wow.ahoo.me](https://wow.ahoo.me)); Viewer is frozen and superseded by `@ahoo-wang/wow-view-engine`, which is not published yet.

## Use the right depth

Entry pages explain purpose, prerequisites, and topic choices; each package ends with a complete symbol index. Topic pages explain parameters, defaults, results, failures, and lifecycle. Use [Guides](../guides/index.md) for end-to-end work and [Start](../start/index.md) for your first integration.

Reference follows current public exports and implementations. A source file inside a package does not imply a public package import.
