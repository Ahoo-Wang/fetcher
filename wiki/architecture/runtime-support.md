---
title: Runtime support and SSR
description: Check platform capabilities and scope mutable identity state before sharing clients.
---

# Runtime support and SSR

Choose the environment before deciding which client objects to share. The core delegates transport to native Fetch; storage and React layers introduce additional platform and lifecycle assumptions.

| Environment            | Prerequisite                                                                        | Application responsibility                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Browser HTTP           | Fetch and the native request/response APIs used by the endpoint                     | Configure origin, CORS, cookies, and response validation with the server                                           |
| Browser SSE            | A readable response body and the stream APIs used by the pipeline                   | Own stream consumption and cancellation                                                                            |
| Node consumer          | Library manifests declare Node `>=18.20.8`                                          | Check the selected package and its actual dependency chain; this declaration is not a tested matrix for every tool |
| Repository development | Node `>=22.12.0`, pnpm `10.34.5`                                                    | Use the repository toolchain for building and tests                                                                |
| React                  | Peer React `^19.0.0`; repository development and tests use React/ReactDOM `^19.3.0` | Validate your framework and SSR import/render/hydration path; do not infer React 18 support                        |

Requirements come from [packages/fetcher/package.json:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/package.json#L31), [package.json:41](https://github.com/Ahoo-Wang/fetcher/blob/main/package.json#L41), [pnpm-workspace.yaml:31](https://github.com/Ahoo-Wang/fetcher/blob/main/pnpm-workspace.yaml#L31), and the [package manifests](./package-boundaries.md). Stream extraction checks the body in [packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38).

## Share configuration only within its intended identity scope

A client can be reused for stable service defaults, but its `headers`, `timeout`, and `urlBuilder` are mutable. The registrar is one process-wide instance kept on `globalThis`, shared even by a second copy of the package. In SSR, changing a shared client's authorization header for each incoming user request can expose one request's identity to another. Use request-scoped clients or pass identity through request options without mutating shared defaults; scope associated token/storage state as well. See [packages/fetcher/src/fetcher.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L127) and [packages/fetcher/src/fetcherRegistrar.ts:172](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L172).

`getStorage()` uses browser localStorage when `window` exists and creates an in-memory implementation otherwise. That fallback does not establish a server request scope or cross-process persistence. Access to disabled localStorage is not caught by this path. Choose an explicit storage implementation and lifetime when those constraints matter. See [packages/storage/src/env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20) and [storage runtime reference](../reference/storage/serialization-and-runtime.md).

## Scope React state to one user

React hooks keep their state inside the mounted component; they do not cache responses across components or requests. On a server, a hook that renders during SSR still uses whatever client and storage it is given, so the identity rules above apply to the clients you pass in. Remounting a subtree when the tenant or user changes separates UI state; the server must still enforce access control. A particular SSR framework still needs import, render, and hydration validation; this chapter does not certify all frameworks.

The 5.x Viewer (`@ahoo-wang/fetcher-viewer`) reads `window` during render and must be mounted behind a client-only boundary; see the 5.x [Viewer guides](../guides/viewer/index.md).

Continue with [shared clients](../guides/http/shared-client.md), [storage and events](../guides/integrations/storage-and-events.md), and [state ownership](./state-and-resources.md).
