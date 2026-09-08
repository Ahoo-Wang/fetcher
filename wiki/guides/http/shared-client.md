---
title: Reuse a shared HTTP client
description: Configure a reusable origin, headers, and request timeout with explicit identity ownership.
---

# Reuse a shared HTTP client

## Prerequisites

Complete [installation](../../start/installation.md) and start the server from [the HTTP example](../../examples/http.md). It serves `GET /users/1` as JSON `{ "id": 1, "name": "Ada" }`. Use a Fetch-capable runtime; the core package requires no React or platform service.

## Create and reuse the client

In your application's `api.ts`, export one client for calls sharing the same configuration:

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'http://127.0.0.1:8787',
  headers: { Accept: 'application/json' },
  timeout: 5_000,
});
```

Import `api` into a service module. Call `await api.get('/users/1')`, then consume the returned `Response` with `await response.json()`, or use an explicit [JSON extractor](./results.md). You should see Ada. A second call uses the same configuration but creates a new exchange and makes another HTTP request.

Choose an application API origin before shipping. Browser cross-origin requests require the server's CORS policy; an HTTPS page cannot freely call an HTTP API. Do not send authentication headers to an untrusted origin.

## Scope defaults to their owner

Request headers override matching client headers; request timeout overrides client timeout. Put stable application defaults on the client, and request-specific parameters on the call. The mutable defaults do not provide identity isolation: on a server, use a request/session-scoped client or explicit per-request authorization instead of changing a global client's token for each incoming user.

A shared client is not a shared response cache. There is no automatic cross-request deduplication or general retry in this setup.

## Failures and cleanup

Catch rejections where the application can display or report them. For the example, stop the local fixture with Ctrl+C after all requests finish. A client has no connection-pool disposal API here; [cancel active requests](./cancellation.md) through their owner before retiring it. If you installed custom interceptors on a longer-lived client, remove owned registrations when the feature ends.

Continue with [request construction](./requests.md), [client reference](../../reference/fetcher/client.md), and [state ownership](../../architecture/state-and-resources.md).
