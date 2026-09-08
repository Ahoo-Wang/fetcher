---
title: Your first request
description: Run a typed JSON request and verify the HTTP 404 failure path.
---

# Your first request

Complete [installation](./installation.md), then create these files in the `fetcher-first-request` directory.

## Create `server.mjs`

<<< @/examples/http/server.mjs

## Create `client.ts`

<<< @/examples/http/client.ts

The generic describes the expected TypeScript shape; it does not validate server data. The explicit id and name check provides this example's runtime boundary. `ResultExtractors.Json` is passed in the third argument to `get`, where request options belong.

The 404 is exposed as an `ExchangeError`. Its `cause` is `HttpStatusValidationError`, and `exchange.response.status` retains `404`. Transport and parsing failures do not match that branch and are rethrown.

## Create `tsconfig.json`

<<< @/examples/http/tsconfig.json

## Compile and run

Start the deterministic local fixture:

```bash
pnpm exec tsc -p tsconfig.json
node server.mjs
```

In another terminal in the same directory, run:

```bash
node dist/client.js
```

The client verifies both the fixed user and the 404 branch, then prints:

```text
Ada
```

Press `Ctrl+C` in the server terminal to stop it. Running the client without the server exits non-zero because the transport error is rethrown.

See the [repository HTTP example](../examples/http.md) for repository-specific verification commands.
