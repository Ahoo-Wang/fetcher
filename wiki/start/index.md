---
title: Start with Fetcher
description: Choose the shortest path from the core Fetch client to the Fetcher package you need.
---

# Start with Fetcher

Fetcher is a set of TypeScript packages for HTTP requests and the workflows built around them. You can use `@ahoo-wang/fetcher` by itself; every other package is optional.

## Pick a path

| Goal                                     | Start here                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| Send a typed HTTP request                | [First Request](./first-request.md)                     |
| Check runtime and peer dependencies      | [Installation](./installation.md)                       |
| Decide which package belongs in your app | [Choose Packages](./choose-packages.md)                 |
| Understand the request pipeline          | [Fetcher architecture](../architecture/fetcher-core.md) |
| Try React and Viewer behavior            | [Storybook](https://fetcher.ahoo.me/storybook/)         |

## The shortest useful setup

```bash
pnpm add @ahoo-wang/fetcher
```

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const response = await api.get('/users/{id}', {
  urlParams: { path: { id: '42' } },
});

const user = await response.json();
```

Fetcher adds URL templates, query serialization, JSON bodies, timeouts, status validation, interceptors, and result extraction without hiding the native request/response model.

## Add packages only when the job appears

- Add `fetcher-eventstream` when you consume SSE or LLM token streams.
- Add `fetcher-decorator` when a service interface is clearer than ad hoc calls.
- Add `fetcher-generator` when OpenAPI is already your contract.
- Add `fetcher-react` when request state belongs in React.
- Add `fetcher-wow`, `fetcher-cosec`, or `fetcher-viewer` only for those integrations.

See [Choose Packages](./choose-packages.md) for the complete map.
