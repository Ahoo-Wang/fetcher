---
title: Choose Packages
description: Match each Fetcher package to the developer job it performs.
---

# Choose Packages

Start with the core client. Add another package only when its job exists in your application.

| Developer job                | Package                          | Use it when                                                                                      |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Send HTTP requests           | `@ahoo-wang/fetcher`             | You need URL templates, query values, JSON bodies, timeouts, interceptors, or status validation. |
| Declare service methods      | `@ahoo-wang/fetcher-decorator`   | Decorated service classes are easier to maintain than repeated request calls.                    |
| Publish typed events         | `@ahoo-wang/fetcher-eventbus`    | Components or tabs need serial, parallel, or broadcast events.                                   |
| Consume SSE                  | `@ahoo-wang/fetcher-eventstream` | A response delivers events or token chunks over a stream.                                        |
| Call OpenAI Chat Completions | `@ahoo-wang/fetcher-openai`      | You need the ecosystem's typed non-streaming and streaming client.                               |
| Model an OpenAPI document    | `@ahoo-wang/fetcher-openapi`     | Your tooling needs OpenAPI 3.x TypeScript types without runtime code.                            |
| Generate clients             | `@ahoo-wang/fetcher-generator`   | OpenAPI is the source contract for models and API clients.                                       |
| Bind requests to React       | `@ahoo-wang/fetcher-react`       | A component needs loading, result, error, debounce, storage, or Wow query state.                 |
| Store typed values           | `@ahoo-wang/fetcher-storage`     | Browser and non-browser code need a common key/value abstraction.                                |
| Integrate CoSec              | `@ahoo-wang/fetcher-cosec`       | Requests need CoSec tokens, refresh, space, device, or attribution behavior.                     |
| Integrate Wow CQRS           | `@ahoo-wang/fetcher-wow`         | A client sends Wow commands or snapshot/event queries.                                           |
| Build data viewers           | `@ahoo-wang/fetcher-viewer`      | A React application needs reusable filters, tables, views, or remote Viewer definitions.         |

## Common combinations

### Typed REST client

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
```

### OpenAPI-generated client

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
pnpm add -D @ahoo-wang/fetcher-generator
```

### Streaming React client

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-react react react-dom
```

### Wow data application

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-wow @ahoo-wang/fetcher-react
```

Add `fetcher-viewer` only when you need its opinionated Ant Design data interface.

## When the core package is enough

Do not install decorators, code generation, React integration, or a Viewer for a small request module. `Fetcher` already returns native `Response` objects and accepts native request options, so a direct client is the simplest default.
