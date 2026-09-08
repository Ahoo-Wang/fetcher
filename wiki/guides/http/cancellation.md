---
title: Cancel requests and set timeouts
description: Assign AbortController ownership and distinguish response acquisition from full body deadlines.
---

# Cancel requests and set timeouts

## Prerequisites

Use the [local HTTP setup](../../start/first-request.md). Decide which page, task, or session owns each request before introducing cancellation. A controller is for one attempt; an aborted controller cannot be reset.

## Cancel one attempt

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const controller = new AbortController();
const pending = api.get('/users/1', {
  abortController: controller,
  timeout: 5_000,
});
controller.abort();
try {
  await pending;
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.log('Request cancelled');
}
```

Run this instead of the tutorial client body. Immediate cancellation prints `Request cancelled`; it is not proof the server never received the request. In a UI, retain the controller at the owner, start the request on the load action, and invoke abort on Stop or owner cleanup.

## Choose a deadline

Set client `timeout` for a default, and request `timeout` for an override, both in milliseconds. Omitted/zero timeout disables the library timer. Passing `abortController` allows caller cancellation to compose with that timer. Passing a native `signal` instead takes the direct fetch path and bypasses the library timer even if timeout is set.

To bound the entire request plus body consumption, own the signal and timer around both awaits:

```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5_000);
try {
  const response = await api.get('/users/1', { signal: controller.signal });
  console.log(await response.json());
} finally {
  clearTimeout(timer);
}
```

Place this in an async application function and catch its rejection at the caller. This replaces, rather than adds to, the library deadline. The built-in timer ends when native fetch returns the response; it does not cover later JSON decoding or an entire SSE stream.

## Observe failure and release ownership

Library timeout is available through `ExchangeError.cause` as `FetchTimeoutError`; native abort and later body reads can surface differently. Check your owned signal when cancellation is an expected action, while still reporting unrelated failures. Stop the fixture after the check. For streaming consumers, also cancel/release the reader in a finally block. Cancellation stops client work where the transport observes the signal; it does not roll back a server-side write.

See [errors and cancellation reference](../../reference/fetcher/errors-and-cancellation.md), [SSE cleanup](../streaming/sse.md), and [failure model](../../architecture/failure-model.md).
