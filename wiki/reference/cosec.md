---
title: CoSec reference
description: Configure CoSec attribution headers, JWT persistence, refresh, and 401 or 403 handling.
---

# `@ahoo-wang/fetcher-cosec`

The CoSec package composes request attribution and optional JWT authentication
into a Fetcher interceptor chain.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

## Configure a client

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer, CoSecTokenRefresher } from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const refreshFetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const cosec = new CoSecConfigurer({
  appId: 'developer-console',
  tokenRefresher: new CoSecTokenRefresher({
    fetcher: refreshFetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => showAccessDenied(),
});

cosec.applyTo(api);
```

Use a separate unconfigured Fetcher for refresh requests. The built-in
refresher marks its request to prevent recursive token refresh.

## `CoSecConfig`

| Option            | Default                 | Effect                                    |
| ----------------- | ----------------------- | ----------------------------------------- |
| `appId`           | required                | Adds the application identifier           |
| `tokenStorage`    | `new TokenStorage()`    | Persists and broadcasts JWT changes       |
| `deviceIdStorage` | `new DeviceIdStorage()` | Persists the device identifier            |
| `tokenRefresher`  | none                    | Enables bearer auth and automatic refresh |
| `spaceIdProvider` | no space                | Resolves an optional space identifier     |
| `onUnauthorized`  | none                    | Handles final `401` responses             |
| `onForbidden`     | none                    | Handles `403` responses                   |

Without `tokenRefresher`, the configurer still adds application, device,
request, and optional resource-attribution data, but it does not add bearer
authentication interceptors.

## Tokens

`TokenStorage` stores a JWT composite token and exposes `signIn()`, `signOut()`,
`authenticated`, and `currentUser`. `JwtTokenManager` deduplicates concurrent
refresh attempts. A failed refresh removes the stored token and throws
`RefreshTokenError`.

Request interceptors preserve an explicit `Authorization` header. Never log,
embed, or commit real access and refresh tokens.

## Advanced composition

Public interceptors include CoSec request headers, authorization request and
response handling, resource attribution, and 401/403 error handlers. Prefer
`CoSecConfigurer`; instantiate individual interceptors only when an application
owns a genuinely different pipeline.

See [Add CoSec authentication](../recipes/cosec-authentication.md) for sign-in,
sign-out, space attribution, and safe testing.
