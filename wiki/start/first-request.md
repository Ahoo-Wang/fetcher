---
title: Your first request
description: Install, request, extract JSON, and handle failure.
---

# Your first request

## Install

```bash
pnpm add @ahoo-wang/fetcher
```

Run the example in a Fetch-capable browser project or Node.js environment. It uses an external demonstration service and needs network access; replace it with your application endpoint for integration.

## Create a client and read a user

```ts
import {
  ExchangeError,
  Fetcher,
  JsonResultExtractor,
} from '@ahoo-wang/fetcher';

interface User {
  id: number;
  name: string;
}
const api = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5_000,
});

try {
  const user = await api.get<User>(
    '/users/{id}',
    {
      urlParams: { path: { id: 1 } },
    },
    { resultExtractor: JsonResultExtractor },
  );
  console.log(user.name);
} catch (error) {
  if (error instanceof ExchangeError) {
    console.error(error.exchange.response?.status, error.message);
  } else {
    throw error;
  }
}
```

## What happened

`baseURL` combines with `/users/{id}` and `urlParams.path` substitutes `1`. The `get` helper returns `Response` by default; its third argument selects `JsonResultExtractor` to read JSON directly.

Default status validation accepts 200–299. Rejected HTTP status or transport failure can expose request context through `ExchangeError`. JSON parsing can fail during result extraction, so handling one error class is not exhaustive. The `User` generic does not validate server JSON; validate data at your application boundary.

## Connect your own endpoint

Replace baseURL, path, and User. Add `query: { active: true }` under urlParams when you need query parameters. Keep private service credentials out of browser code.

Continue with [Requests and results](../learn/requests-and-results.md), or look up [Client configuration](../reference/fetcher/client.md) and [Errors and cancellation](../reference/fetcher/errors-and-cancellation.md).
