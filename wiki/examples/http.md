---
title: Runnable HTTP example
description: Run a local deterministic server and verify Fetcher success and HTTP failure behavior.
---

# Runnable HTTP example

This repository example has no external network dependency. The fixture returns `{ "id": 1, "name": "Ada" }` for `GET /users/1` and a JSON 404 for every other request.

## Server

<<< @/examples/http/server.mjs

## Client

<<< @/examples/http/client.ts

The client selects JSON extraction in the third argument to `get`. It also confirms that `/missing` becomes an `ExchangeError` whose cause is `HttpStatusValidationError` and whose response status is `404`; any other error is rethrown.

## Run in this repository

From the repository root, use the repository's Node `>=20.20.2` and pnpm `10.34.5` toolchain:

```bash
pnpm --filter @ahoo-wang/fetcher build
pnpm exec tsc -p wiki/examples/http/tsconfig.json
node wiki/examples/http/server.mjs
```

Keep that terminal open. In another terminal, run:

```bash
node wiki/examples/http/dist/client.js
```

Expected output:

```text
Ada
```

Press `Ctrl+C` in the server terminal to stop the fixture. See [Your first request](../start/first-request.md) to copy this example into an independent project.
