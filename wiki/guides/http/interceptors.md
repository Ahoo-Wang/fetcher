---
next: false
title: Extend the request pipeline
description: Add and remove an owned interceptor at the stage where its input is available.
---

# Extend the request pipeline

## Prerequisites

Run [the local HTTP example](../../examples/http.md) and understand [request/result separation](./results.md). An interceptor operates on the shared `FetchExchange`, the context for one request. For static headers, [client defaults](./shared-client.md) are sufficient; use an interceptor for per-request behavior.

## Register before the call

```ts
import { Fetcher, setHeader } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const name = 'example-request-source';
api.interceptors.request.use({
  name,
  order: 0,
  intercept(exchange) {
    setHeader(exchange.ensureRequestHeaders(), 'X-Request-Source', 'docs');
  },
});
try {
  const response = await api.get('/users/1');
  console.log(await response.json());
} finally {
  api.interceptors.request.eject(name);
}
```

Save this in the tutorial client file and run it using the existing compilation commands. The JSON response contains Ada. The fixture does not echo request headers; verify `X-Request-Source: docs` in a controlled fetch stub or server request capture. Registration returns false for a duplicate name, so register once per owner instead of on every request.

## Pick the stage

Request, response, and error registries run their interceptors in ascending `order`. The default request chain performs body conversion, URL resolution, and fetch. The order-zero request interceptor above runs after default body conversion and before URL resolution/transport. It must not assume the URL is already resolved or replace a serialized body with an object without reapplying body processing.

Use a response interceptor for response metadata without consuming the body needed by the later result extractor. Default HTTP status validation also lives in that phase; choose ordering deliberately if you need to observe rejected statuses. Use an error interceptor for request/response-stage errors. JSON result parsing occurs afterward, so catch extraction failure at the application call.

## Failures and cleanup

Do not clear the entire registry to remove one feature: that would also remove built-in transport or status handling. Eject the registered name when its owner ends, as the example does. Interceptor exceptions can fail the request. Recovery by clearing `exchange.error` requires a usable response and does not repeat the response stage. Core does not install a general retry policy; implement only the replay behavior your server contract permits.

See [registration and ordering](../../reference/fetcher/interceptors.md), [request lifecycle](../../architecture/request-lifecycle.md), and [failure handling](./failures.md).
