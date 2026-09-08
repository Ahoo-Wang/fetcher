---
prev: false
title: Architecture and choices
description: Choose the smallest client layer and identify the responsibilities that remain in your application.
---

# Architecture and choices

Start with the layer that solves your current problem. `Fetcher` sends HTTP requests and provides shared defaults, interceptors, and result extraction. It does not require React, a Wow backend, or an authentication service. Its configuration and request pipeline live in [packages/fetcher/src/fetcher.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L145).

| Your decision                             | Read                                                | What you will decide                                                     |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| Which packages belong in the application? | [Package boundaries](./package-boundaries.md)       | Runtime clients, peer installation requirements, and development tools   |
| Where will the client run?                | [Runtime support](./runtime-support.md)             | Browser capabilities, Node requirements, and SSR identity scope          |
| Where should cross-cutting behavior run?  | [Request lifecycle](./request-lifecycle.md)         | Request/response interception versus result extraction                   |
| Who owns data and cleanup?                | [State and resources](./state-and-resources.md)     | Hook state, table data, view persistence, and resource disposal          |
| What does a rejected request mean?        | [Failure model](./failure-model.md)                 | Transport, status, decoding, cancellation, and stream failures           |
| Which API style or table component fits?  | [Integration decisions](./integration-decisions.md) | Direct calls, declared/generated services, and View/Viewer/FetcherViewer |

## Add a layer for a concrete responsibility

Use the [HTTP guides](../guides/http/index.md) for ordinary endpoints, [service guides](../guides/services/index.md) when endpoint declarations repeat, and [React guides](../guides/react/index.md) when components need request state. [Viewer guides](../guides/viewer/index.md) begin with application-owned data; remote saved views are a separate integration choice.

Each added layer has a contract. SSE needs a readable event stream; FetcherViewer needs its view-definition, query, and command backend. Installing a client does not create those server capabilities. The actual remote row query is visible in [packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L53).

## Keep guarantees at their boundary

TypeScript types describe data but do not validate a response at runtime. UI stale-result protection does not enforce server authorization. A command being processed does not make every projection immediately current. Decide validation, permissions, idempotency, and data freshness with the service that owns them, then connect that service through the appropriate client. The [reference](../reference/index.md) documents individual exported APIs; these architecture pages explain where their responsibilities stop.
