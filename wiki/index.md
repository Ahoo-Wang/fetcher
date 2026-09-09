---
layout: home
title: TypeScript HTTP clients on native Fetch
description: Use Fetcher for HTTP, service clients, streaming, and React data interactions.
hero:
  name: Fetcher
  text: From one request to application data
  tagline: Shared configuration and explicit results, built on native Fetch.
  image:
    src: /fetcher-logo.png
    alt: Fetcher request and response logo
  actions:
    - theme: brand
      text: Start building
      link: ./start/
    - theme: alt
      text: Evaluate architecture
      link: ./architecture/
features:
  - title: HTTP requests
    details: Share configuration, send data, and handle results and failures on native Fetch.
    link: /guides/http/
    linkText: Learn more
  - title: Service clients
    details: Declare service methods or generate TypeScript clients from an OpenAPI document.
    link: /guides/services/
    linkText: Learn more
  - title: Streaming
    details: Consume SSE events and manage cancellation, connection lifetimes, and cleanup.
    link: /guides/streaming/
    linkText: Learn more
  - title: React data flow
    details: Connect request execution, loading, errors, and cancellation to React components.
    link: /guides/react/
    linkText: Learn more
  - title: Data views
    details: Choose View Engine with shadcn/Base UI or Ant Design Viewer for tables, filters, and saved views.
    link: /start/first-view
    linkText: Learn more
  - title: Architecture and choices
    details: Evaluate package boundaries, runtime requirements, and integration responsibilities.
    link: /architecture/
    linkText: Learn more
---

## Make requests and results explicit

```ts
const user = await client.get<User>(
  '/users/1',
  {},
  {
    resultExtractor: ResultExtractors.Json,
  },
);
```

`client` is a configured `Fetcher` instance; import `ResultExtractors` from the core package. Run [your first request](./start/first-request.md) for the complete setup, local server, and failure branch.
