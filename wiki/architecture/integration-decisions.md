---
next: false
title: Integration decisions
description: Compare client styles and service integrations by the contracts and maintenance they require.
---

# Integration decisions

Use the least elaborate layer that matches the service you actually have. Move up when it removes repeated work you already maintain, and include its configuration and backend contract in the decision.

## Direct, declarative, or generated clients

| Choice            | Use when                                                 | What you own                                                                                     | Poor fit                                                                       |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Direct `Fetcher`  | A few calls or endpoint-specific behavior                | Paths, request options, result selection, boundary validation                                    | Many repeated endpoint declarations that drift independently                   |
| Decorator service | Stable methods benefit from a shared service declaration | Metadata/compiler setup, parameter annotations, endpoint accuracy                                | You do not want decorator configuration or the API is mostly ad hoc            |
| Generated service | An actual OpenAPI document is the maintained contract    | Generation command/configuration, review and compilation of output, regeneration on spec changes | Missing or inaccurate specification; server semantics absent from the document |

These share the runtime request boundary: core implements request/extraction ([packages/fetcher/src/fetcher.ts:236](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L236)), decorator has a metadata runtime dependency ([packages/decorator/package.json:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/package.json#L58)), and the 5.x generator is a CLI ([packages/generator/src/cli.ts:8](https://github.com/Ahoo-Wang/fetcher/blob/5.x/packages/generator/src/cli.ts#L8)). OpenAPI exports type definitions ([packages/openapi/src/index.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/index.ts#L21)). Neither annotations nor generated types validate response data at runtime or invent missing server semantics.

Start with [HTTP requests](../guides/http/requests.md), then use [declarative client](../guides/services/declarative-client.md) or the verified workflow in [generated client](../guides/services/generated-client.md). Configuration details live in [decorator reference](../reference/decorator/index.md) and [generator reference](../reference/generator/index.md). The generator is part of the 5.x line; from 6.0 it lives in the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript). Check the [peer graph](./package-boundaries.md) separately from the code you expect to execute.

## Data views

Fetcher main ships no table or data-view component. `@ahoo-wang/fetcher-viewer` (View, Viewer, FetcherViewer) is frozen in the 5.x line (npm 5.1.x, branch [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x/packages/viewer)); its [guides](../guides/viewer/index.md) and [reference](../reference/viewer/index.md) remain for existing consumers. It is superseded by `@ahoo-wang/wow-view-engine` in the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript), which is not published yet. For a new table today, compose [React request state](../guides/react/index.md) with the table component your application already uses, and keep filtering, sorting and pagination in your data service.

## Service-specific integrations

| Integration            | Required contract                                                   | Responsibility retained by the service/application                                                      |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Wow (5.x client)       | Command results/stages and supported query DSL                      | Authorization, tenant isolation, idempotency, projection freshness                                      |
| CoSec                  | Token storage, attribution headers, refresh endpoints/session rules | Identity lifetime, replay safety, server authorization, which origins receive credentials (`isTrusted`) |
| SSE / OpenAI streaming | Compatible event stream and payload format                          | Partial-result UX, cancellation, reconnect policy if required                                           |

Client-side conditions describe the query sent; they are not access control. Command stages describe protocol progress; they are not a universal consistency guarantee. CoSec's guarded refresh implementation is specific to its authentication exchange ([packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80)), while SSE extraction requires a readable body ([packages/eventstream/src/eventStreamResultExtractor.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/eventStreamResultExtractor.ts#L38)).

Continue with [CoSec](../guides/integrations/cosec.md) and [streaming](../guides/streaming/index.md). The Wow client belongs to the 5.x line ([Wow guide](../guides/integrations/wow.md)); from 6.0 it is documented at [wow.ahoo.me](https://wow.ahoo.me). Before sharing these integrations across identities, read [runtime support](./runtime-support.md); before adding retries, read the [failure model](./failure-model.md).
