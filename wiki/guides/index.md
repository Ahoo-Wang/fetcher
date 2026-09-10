---
prev: false
next: false
title: Build your application
description: Choose HTTP, service, stream, React, data-view, or integration tasks.
---

# Build your application

Choose the task you need to complete. New to Fetcher? [Start with a runnable result](../start/index.md) first.

- [HTTP requests](./http/index.md): A Fetch-capable runtime and the core package. Run the local HTTP example before connecting an application API.
- [Service clients](./services/index.md): Use direct Fetcher calls for a few endpoints. Decorators require a compatible TypeScript compiler; generation requires a complete OpenAPI document and a compile step. Neither creates backend routes.
- [Streaming data](./streaming/index.md): Your runtime needs Fetch, Response bodies, and ReadableStream. The server must emit SSE frames; a normal JSON response is not an event stream. Keep a caller-owned cancellation signal for long-lived reads.
- [React data flow](./react/index.md): Start in an existing React application with the declared peer dependencies. The runnable React example supplies a deterministic backend fixture; production routes remain application-owned.
- [View Engine](./view-engine/index.md): Build a shadcn/Base UI record page with component-configuration persistence, built-in filters/cells and explicit ViewHost services. Start with the workspace example.
- [Ant Design Viewer (maintenance mode, deprecated)](./viewer/index.md): Start with local data in a React application with Viewer peers. View displays one view; Viewer also manages a view collection. Your data adapter applies queries and owns persistence.
- [Platform integrations](./integrations/index.md): Wow and CoSec require compatible server protocols, authentication and application-specific routes. Storage and local events can be used without a platform server. Confirm the chosen package peers before installing.

For a working baseline use [complete examples](../examples/index.md). For ownership and adoption tradeoffs use [architecture](../architecture/index.md).
