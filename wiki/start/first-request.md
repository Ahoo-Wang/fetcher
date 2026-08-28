---
title: First Request
description: Install Fetcher and make a typed HTTP request in five minutes.
---

# First Request

## Prerequisites

Use Node.js `>=18.20.8` or a browser project with native Fetch support.

## Install

```bash
pnpm add @ahoo-wang/fetcher
```

## Create a client

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5_000,
});
```

Client options become defaults for every request. Request options override them.

## Send a request

```ts
const response = await api.get('/users/{id}', {
  urlParams: {
    path: { id: '42' },
    query: { include: 'profile' },
  },
});
```

Fetcher resolves this URL:

```text
https://api.example.com/users/42?include=profile
```

## Read the result

HTTP helpers return the native `Response` by default:

```ts
interface User {
  id: string;
  name: string;
}

const user = (await response.json()) as User;
console.log(user.name);
```

Keep validation at the trust boundary: a TypeScript assertion does not validate server data.

## Handle a failed response

The default status validator accepts `200` through `299`. A rejected status or request failure reaches the Fetcher error hierarchy:

```ts
import { ExchangeError, FetcherError } from '@ahoo-wang/fetcher';

try {
  await api.get('/users/missing');
} catch (error) {
  if (error instanceof ExchangeError) {
    console.error(error.exchange.response?.status, error.message);
  } else if (error instanceof FetcherError) {
    console.error(error.message);
  } else {
    throw error;
  }
}
```

`ExchangeError.exchange` keeps the request, response, attributes, and underlying error together for diagnosis.

## Next steps

- [Choose Packages](./choose-packages.md) for optional capabilities.
- [Fetcher reference](../reference/fetcher.md) for client and request options.
- [Request lifecycle](../learn/request-lifecycle.md) for the interceptor pipeline.
- [Storybook](https://fetcher.ahoo.me/storybook/) for interactive request behavior.
