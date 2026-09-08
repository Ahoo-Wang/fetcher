---
title: Start with Fetcher
description: Start with one HTTP request, then compose services, streams, and React.
---

# Start with Fetcher

Fetcher is a TypeScript HTTP client built on the native Fetch API. The core package owns URLs, request bodies, status validation, interceptors, and result extraction. Add other packages as your workflow needs them.

## Complete one request first

1. [Install](./installation.md): check your runtime and add the core package.
2. [First request](./first-request.md): create a client, read JSON, and handle failure.
3. [Requests and results](../learn/requests-and-results.md): use parameters, bodies, and result types.
4. [Errors and timeouts](../learn/interceptors-errors-timeouts.md): understand failure and cancellation ownership.

## Continue from what you already have

| Your input          | Next step                                          |
| ------------------- | -------------------------------------------------- |
| An HTTP address     | [Fetcher reference](../reference/fetcher/index.md) |
| An OpenAPI document | [Generate a client](../recipes/openapi-client.md)  |
| An SSE endpoint     | [Consume a stream](../learn/streaming.md)          |
| A React page        | [React data flow](../learn/react-data-flow.md)     |
| A Wow service       | [CQRS recipe](../recipes/wow-cqrs.md)              |

Use [Choose packages](./choose-packages.md) to understand the ecosystem. Your first integration does not require every package.
