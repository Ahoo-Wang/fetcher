---
next: false
title: Choose your next task
description: Extend the first successful request or table with one concrete application capability.
---

# Choose your next task

After the first example succeeds, choose the change your application needs next. Each guide states its backend and resource requirements.

| Next outcome                                    | Guide                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Reuse one origin, headers, and timeout policy   | [Shared HTTP client](../guides/http/shared-client.md)                                             |
| Send parameters or JSON and select a result     | [Construct requests](../guides/http/requests.md) → [read results](../guides/http/results.md)      |
| Show useful failures and stop abandoned work    | [Handle failures](../guides/http/failures.md) → [cancel requests](../guides/http/cancellation.md) |
| Give repeated endpoints named methods           | [Service clients](../guides/services/index.md)                                                    |
| Display events or completion text incrementally | [Streaming](../guides/streaming/index.md)                                                         |
| Drive requests from React inputs                | [React queries](../guides/react/queries.md) → [debounce](../guides/react/debounce.md)             |
| Make table controls change displayed rows       | [Viewer data tasks](../guides/viewer/index.md) (5.x)                                              |
| Connect an existing platform service            | [CoSec, storage and events](../guides/integrations/index.md); Wow (5.x)                           |

Use [architecture and selection](../architecture/index.md) to decide who owns state, cancellation, and persistence. Use [API reference](../reference/index.md) when you know the operation and need its exact contract; the [complete examples](../examples/index.md) remain the executable baseline.

Wow, the generator and the data-view components continue in the [Wow repository](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) from 6.0; see [wow.ahoo.me](https://wow.ahoo.me).
