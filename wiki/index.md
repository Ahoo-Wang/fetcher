---
layout: home
title: Fetcher
description: Start with one HTTP request, then compose services, streams, and React.
hero:
  name: Fetcher
  text: From HTTP requests to application data
  tagline: Start with one HTTP request, then compose services, streams, and React.
  actions:
    - theme: brand
      text: Send your first request
      link: /start/first-request
    - theme: alt
      text: Explore the API
      link: /reference/
features:
  - title: Requests and results
    details: Compose URLs, parameters, and bodies; choose Response or JSON explicitly.
    link: /learn/requests-and-results
  - title: Streams and services
    details: Consume SSE, declare services, or generate clients from OpenAPI.
    link: /start/choose-packages
  - title: React and data views
    details: Connect loading, results, errors, and cancellation to your UI; add Viewer when needed.
    link: /learn/react-data-flow
---

## One client. An explicit result.

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

Generics describe the expected shape; they do not validate runtime data. This example calls a public demonstration endpoint and needs network access.

[Read the complete introduction](./start/index.md) · [Choose your packages](./start/choose-packages.md) · [Storybook](https://fetcher.ahoo.me/storybook/)
