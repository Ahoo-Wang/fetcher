---
next: false
title: Integration decisions
description: Compare client styles and table layers by the contracts and maintenance they require.
---

# Integration decisions

Use the least elaborate layer that matches the service you actually have. Move up when it removes repeated work you already maintain, and include its configuration and backend contract in the decision.

## Direct, declarative, or generated clients

| Choice            | Use when                                                 | What you own                                                                                     | Poor fit                                                                       |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Direct `Fetcher`  | A few calls or endpoint-specific behavior                | Paths, request options, result selection, boundary validation                                    | Many repeated endpoint declarations that drift independently                   |
| Decorator service | Stable methods benefit from a shared service declaration | Metadata/compiler setup, parameter annotations, endpoint accuracy                                | You do not want decorator configuration or the API is mostly ad hoc            |
| Generated service | An actual OpenAPI document is the maintained contract    | Generation command/configuration, review and compilation of output, regeneration on spec changes | Missing or inaccurate specification; server semantics absent from the document |

These share the runtime request boundary: core implements request/extraction ([packages/fetcher/src/fetcher.ts:230](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L230)), decorator has a metadata runtime dependency ([packages/decorator/package.json:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/package.json#L56)), and generator is a CLI ([packages/generator/src/cli.ts:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/generator/src/cli.ts#L8)). OpenAPI exports type definitions ([packages/openapi/src/index.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L21)). Neither annotations nor generated types validate response data at runtime or invent missing server semantics.

Start with [HTTP requests](../guides/http/requests.md), then use [declarative client](../guides/services/declarative-client.md) or the verified workflow in [generated client](../guides/services/generated-client.md). Configuration details live in [decorator reference](../reference/decorator/index.md) and [generator reference](../reference/generator/index.md). Check the [peer graph](./package-boundaries.md) separately from the code you expect to execute.

## View, Viewer, or FetcherViewer

| Choice          | Data and state contract                                                                        | Use when                                                 | Cost or mismatch                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `View`          | Receives `PagedList`; emits interaction changes; optional controlled state                     | One table/view with application-owned data               | Application must apply filtering, sorting, and pagination                                      |
| `Viewer`        | Adds saved-view collection and selection; load/save callbacks go to application                | Users switch/save views over your existing data service  | Application implements persistence, errors, and success-callback timing                        |
| `FetcherViewer` | Loads definitions/views and rows; sends Wow view commands through the defined backend protocol | Your service implements that protocol and identity model | Requires compatible endpoints and projection behavior; not a generic REST configuration widget |

The first two responsibilities follow [packages/viewer/src/view/View.tsx:417](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L417) and [packages/viewer/src/viewer/Viewer.tsx:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L140); remote row loading follows [packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L53). FetcherViewer creation/update confirmation and deletion have different scopes; review [state and resources](./state-and-resources.md) before promising saved results to users.

For a local table, use [local data](../guides/viewer/local-data.md) and implement [pagination and sorting](../guides/viewer/pagination-and-sorting.md) in the application. Add [saved views](../guides/viewer/saved-views.md) when users need persistence. Adopt [remote data](../guides/viewer/remote-data.md) only with the backend contract. Consult [View/Viewer reference](../reference/viewer/view-and-viewer.md) and [FetcherViewer reference](../reference/viewer/fetcher-viewer.md) for props.

## Service-specific integrations

| Integration            | Required contract                                                   | Responsibility retained by the service/application                 |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Wow                    | Command results/stages and supported query DSL                      | Authorization, tenant isolation, idempotency, projection freshness |
| CoSec                  | Token storage, attribution headers, refresh endpoints/session rules | Identity lifetime, replay safety, server authorization             |
| SSE / OpenAI streaming | Compatible event stream and payload format                          | Partial-result UX, cancellation, reconnect policy if required      |

Client-side conditions describe the query sent; they are not access control. Command stages describe protocol progress; they are not a universal consistency guarantee. CoSec's guarded refresh implementation is specific to its authentication exchange ([packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80)), while SSE extraction requires a readable body ([packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)).

Continue with [Wow](../guides/integrations/wow.md), [CoSec](../guides/integrations/cosec.md), and [streaming](../guides/streaming/index.md). Before sharing these integrations across identities, read [runtime support](./runtime-support.md); before adding retries, read the [failure model](./failure-model.md).
