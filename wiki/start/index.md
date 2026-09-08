---
prev: false
title: Choose your starting point
description: Start with HTTP, a React request, or a local data table according to your existing application.
---

# Choose your starting point

Fetcher adds reusable request configuration and result handling to native Fetch. Choose the first result you need; a plain HTTP application does not need a UI framework or platform backend.

| Your starting point                        | Prerequisites                                      | First result                                                                                                 |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| TypeScript or JavaScript HTTP client       | A Fetch-capable runtime; the core package          | [Install](./installation.md), then [run a first request](./first-request.md) against a supplied local server |
| Existing React application                 | Compatible React and Fetcher peers, a bundler      | [Run the React example](../examples/react.md) and display loading, data, errors, and cancellation            |
| Existing React application needing a table | Viewer peers, CSS-capable bundling, local row data | [Build a first view](./first-view.md) with pagination, sorting, and filtering                                |

The runnable HTTP and Storybook examples have deterministic fixtures. When you move them into your application, supply the routes and response JSON documented in each example. Installing a client does not create a server.

Already have an API contract? [Declare service methods](../guides/services/declarative-client.md) or [generate from OpenAPI](../guides/services/generated-client.md). Before adopting Wow, CoSec, or remote Viewer, check their [integration requirements](../guides/integrations/index.md).

Continue with [next tasks](./next-steps.md), or [evaluate the architecture](../architecture/index.md) before choosing components.
