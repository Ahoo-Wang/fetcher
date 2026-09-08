---
prev: false
title: 'Cosec reference'
description: 'Cosec reference — Fetcher 5.0.0'
---

# Cosec reference

CoSec request metadata, resource attribution, JWT storage and refresh integrated into Fetcher interceptors.

## Install

```bash
pnpm add @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

The command includes CoSec → Storage/EventBus → Fetcher; nanoid is installed as a regular dependency. Default token/device storages construct broadcast transports immediately. For SSR request isolation, inject request-owned storage and local buses as described in [configuration](./configuration.md).

Version **5.0.0** declares Node **>=18.20.8** for consumers. Repository development requires Node **>=20.20.2** and pnpm **10.34.5**.

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

Use `CoSecConfigurer` for a complete interceptor setup against a CoSec-compatible service. Supply `tokenRefresher` to enable managed Authorization and refresh; without it, the setup only adds metadata/resource attribution plus explicitly configured error callbacks. Use individual interceptors only when the application owns their order and dependencies.

## Topics

- [CoSec configuration](configuration)
- [Tokens and refresh](tokens-and-refresh)
- [Interceptors and attribution](interceptors-and-attribution)

[Complete public symbol index](./symbols.md)
