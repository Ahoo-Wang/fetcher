---
title: Runtime support and SSR
description: Check platform capabilities and scope mutable identity state before sharing clients.
---

# Runtime support and SSR

Choose the environment before deciding which client objects to share. The core delegates transport to native Fetch; storage and UI layers introduce additional platform and lifecycle assumptions.

| Environment            | Prerequisite                                                                                                                  | Application responsibility                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Browser HTTP           | Fetch and the native request/response APIs used by the endpoint                                                               | Configure origin, CORS, cookies, and response validation with the server                                           |
| Browser SSE            | A readable response body and the stream APIs used by the pipeline                                                             | Own stream consumption and cancellation                                                                            |
| Node consumer          | Library manifests declare Node `>=18.20.8`                                                                                    | Check the selected package and its actual dependency chain; this declaration is not a tested matrix for every tool |
| Repository development | Node `>=20.20.2`, pnpm `10.34.5`                                                                                              | Use the repository toolchain for building and tests                                                                |
| React / Viewer         | Matching peer dependencies; repository catalog uses React/ReactDOM `^19.2.8`, antd `^6.6.3`, icons `^6.3.4`, dayjs `^1.11.23` | Validate your framework and SSR import/render/hydration path; do not infer React 18 support                        |

Requirements come from [packages/fetcher/package.json:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/package.json#L31), [package.json:39](https://github.com/Ahoo-Wang/fetcher/blob/main/package.json#L39), [pnpm-workspace.yaml:7](https://github.com/Ahoo-Wang/fetcher/blob/main/pnpm-workspace.yaml#L7), and the [package manifests](./package-boundaries.md). Stream extraction checks the body in [packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38). Generator dependencies may impose stricter runtime requirements than a library's engine declaration.

## Share configuration only within its intended identity scope

A client can be reused for stable service defaults, but its `headers`, `timeout`, and `urlBuilder` are mutable. The registrar is a module-global instance. In SSR, changing a shared client's authorization header for each incoming user request can expose one request's identity to another. Use request-scoped clients or pass identity through request options without mutating shared defaults; scope associated token/storage state as well. See [packages/fetcher/src/fetcher.ts:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L127) and [packages/fetcher/src/fetcherRegistrar.ts:166](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherRegistrar.ts#L166).

`getStorage()` uses browser localStorage when `window` exists and creates an in-memory implementation otherwise. That fallback does not establish a server request scope or cross-process persistence. Access to disabled localStorage is not caught by this path. Choose an explicit storage implementation and lifetime when those constraints matter. See [packages/storage/src/env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20) and [storage runtime reference](../reference/storage/serialization-and-runtime.md).

## Treat Viewer state as application state

With a nonempty view list, `Viewer` reads `window.location.pathname` during render, before any effect runs. The current implementation therefore cannot render directly on a server without `window`. In an SSR application, mount `Viewer` (including `FetcherViewer` when it renders Viewer) behind a client-only render boundary and validate the actual import, render and hydration path. The empty-view early return does not establish SSR support for the complete Viewer. See [packages/viewer/src/viewer/Viewer.tsx:296](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L296).

FetcherViewer creates default-view-ID storage at module scope with the fixed key `fetcher-viewer-local-default-view-id`. Viewer initializes the shared data monitor in an effect. These are reasons to inspect identity and resource lifetime, not a promise of stateless SSR components. See [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L94) and [packages/viewer/src/viewer/Viewer.tsx:222](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L222).

Remounting a view when its definition, tenant, or owner changes separates UI state. The server must still enforce access control, and the application must scope persisted preferences appropriately. A particular SSR framework still needs import, render, and hydration validation; this chapter does not certify all frameworks.

Continue with [shared clients](../guides/http/shared-client.md), [storage and events](../guides/integrations/storage-and-events.md), and [state ownership](./state-and-resources.md).

## View Engine runtime

The view-engine package declares Node >=20.20.2. Its core entry is independent of React and browser globals; browser controls use the separate `/react` entry with React 19. `ViewPage` initializes and disposes its engine in Effects, while caller-owned engines must be scoped and disposed explicitly. Clipboard, page visibility and layout APIs remain browser capabilities. LocalStorageViewHost requires supplied storage and an exclusive lock, such as Web Locks in the development example. Validate a framework-specific SSR/hydration integration instead of treating headless import support as certification of every UI component.
