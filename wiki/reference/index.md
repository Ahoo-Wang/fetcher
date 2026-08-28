---
title: Package reference
description: Choose a Fetcher package, understand its contract, and open the detailed API or matching agent skill.
pageClass: reference-index-page
---

# Package reference

Fetcher is a layered ecosystem, not a framework bundle. Start with the package
that owns the behavior, then add only the integrations the application uses.

::: info Reading a package page
Every reference page covers installation, primary API groups, defaults,
lifecycle, failure behavior, source exports, and the matching agent skill.
Exact long-form signatures remain in each Skill's source-checked API reference.
:::

## Choose by responsibility

| Responsibility                   | Start with                                | Add when                                                          |
| -------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Send an HTTP request             | [`@ahoo-wang/fetcher`](./fetcher.md)      | Always the runtime foundation                                     |
| Expose class-based API services  | [`fetcher-decorator`](./decorator.md)     | Stable service interfaces are useful                              |
| Deliver typed events             | [`fetcher-eventbus`](./eventbus.md)       | Multiple owners react to one event                                |
| Parse SSE and token streams      | [`fetcher-eventstream`](./eventstream.md) | The response is `text/event-stream`                               |
| Persist one typed value          | [`fetcher-storage`](./storage.md)         | State must survive outside a component                            |
| Manage request state in React    | [`fetcher-react`](./react.md)             | UI owns loading, result, error, and cancellation                  |
| Describe OpenAPI documents       | [`fetcher-openapi`](./openapi.md)         | Tooling needs compile-time document types                         |
| Generate typed clients           | [`fetcher-generator`](./generator.md)     | OpenAPI is the API contract                                       |
| Call OpenAI-compatible Chat APIs | [`fetcher-openai`](./openai.md)           | Chat request and stream types are needed                          |
| Add CoSec authentication         | [`fetcher-cosec`](./cosec.md)             | The server speaks the CoSec protocol                              |
| Call Wow commands and queries    | [`fetcher-wow`](./wow.md)                 | The server exposes Wow endpoints                                  |
| Build a data exploration UI      | [`fetcher-viewer`](./viewer.md)           | Filters, tables, saved views, and remote data form one experience |

## Layer map

| Layer      | Packages                                 | What crosses the boundary                                   |
| ---------- | ---------------------------------------- | ----------------------------------------------------------- |
| Transport  | Fetcher, EventStream                     | Request, response, exchange, stream, error                  |
| Service    | Decorator, Generator, OpenAI, Wow, CoSec | Domain-oriented clients and protocol metadata               |
| State      | EventBus, Storage, React                 | Events, persisted values, observable async state            |
| Experience | Viewer                                   | Filters, view state, tables, actions, user-visible failures |

Dependencies should point down this table. If a low-level request helper imports
Viewer or React, the responsibility is in the wrong layer.

## Core contracts at a glance

| Package     | Main entry point                        | Default ownership             | Typical cleanup                                     |
| ----------- | --------------------------------------- | ----------------------------- | --------------------------------------------------- |
| Fetcher     | `Fetcher`, `NamedFetcher`               | Request lifecycle             | Abort caller-owned work; eject dynamic interceptors |
| Decorator   | `@api`, method and parameter decorators | Service metadata              | Application owns shared Fetcher                     |
| EventBus    | `SerialTypedEventBus`, `EventBus`       | Handler delivery              | `off()` / `destroy()`                               |
| EventStream | `Response` helpers, conversion streams  | Stream parsing                | Cancel stream and abort network owner               |
| Storage     | `KeyStorage`                            | One key and its listeners     | Listener remover / `destroy()`                      |
| React       | `useFetcher`, `useFetcherQuery`         | Component-visible async state | Hook unmount plus explicit user abort               |
| Viewer      | `Viewer`, `FetcherViewer`               | Data exploration workflow     | Component and persistence callback lifecycle        |

## Integration contracts at a glance

| Package   | Input source of truth                                   | Failure boundary                                        |
| --------- | ------------------------------------------------------- | ------------------------------------------------------- |
| OpenAPI   | OpenAPI 3 document object                               | Compile-time shape only; runtime validation is external |
| Generator | OpenAPI file or URL plus TypeScript config              | Parsing, discovery, generation, and output compilation  |
| OpenAI    | Chat request and Fetcher configuration                  | Initial HTTP call plus later stream consumption         |
| CoSec     | CoSec server protocol and token state                   | Refresh, final unauthorized, final forbidden            |
| Wow       | Wow routes, metadata, filter, and aggregation contracts | Command result, query validation, HTTP/SSE processing   |

## Reference versus Skills

- Use **Reference** to choose an API, understand defaults, and review behavior.
- Use **Skills** to have Codex implement a task under the corresponding package boundary.
- Use the Skill's `references/api.md` when an agent needs exhaustive signatures or edge cases.

Open the [Skills catalog](../skills/index.md) to select by task.
