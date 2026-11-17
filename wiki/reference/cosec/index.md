---
prev: false
title: 'Cosec reference'
description: 'Cosec reference — Fetcher 6.0.0'
---

# Cosec reference

CoSec request metadata, resource attribution, JWT storage and refresh integrated into Fetcher interceptors.

## Install

```bash
pnpm add @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

The command includes CoSec → Storage/EventBus → Fetcher; nanoid is installed as a regular dependency. CoSec requires Node `^20.19.0 || >=22.12.0` (the other packages declare `>=18.20.8`): nanoid is ES modules only, so CoSec's CommonJS entry needs a Node where `require()` loads ES modules. Default token/device/space storages broadcast across tabs only when they keep their value in the browser's `localStorage`; elsewhere (Node SSR, `sessionStorage`, an injected store) each default storage gets a bus of its own, so per-request storages never share state through a `BroadcastChannel`. For SSR request isolation, inject request-owned storage as described in [configuration](./configuration.md).

The package declares Node **^20.19.0 || >=22.12.0** for consumers. Repository development requires Node **>=22.12.0** and pnpm **10.34.5**.

## Minimal example

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const cosec = new CoSecConfigurer({ appId: 'example-app' });
cosec.applyTo(fetcher);
```

CoSec without a tokenRefresher installs metadata/attribution only. Read configuration before enabling managed authentication.

## Choose an entry point

Use `CoSecConfigurer` for a complete interceptor setup against a CoSec-compatible service. Supply `tokenRefresher` to enable managed Authorization and refresh; without it, the setup only adds metadata/resource attribution plus explicitly configured error callbacks. By default every request, including one to an absolute URL on another origin, carries the token and the CoSec headers; pass `isTrusted: sameOriginTrust` to keep them to the `baseURL` origin and the page origin ([request trust](./interceptors-and-attribution.md#request-trust)). Use individual interceptors only when the application owns their order and dependencies.

## Topics

- [CoSec configuration](configuration)
- [Tokens and refresh](tokens-and-refresh)
- [Interceptors and attribution](interceptors-and-attribution)

[Complete public symbol index](./symbols.md)
