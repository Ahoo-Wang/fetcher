---
title: CoSec reference
description: Configure CoSec attribution headers, JWT persistence, refresh, and 401 or 403 handling.
pageClass: reference-page
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

## Interceptor flow

```text
request attribution
  → optional Authorization header
  → HTTP request
  → optional token refresh and retry
  → unauthorized / forbidden handler
```

| Layer        | Main API                                                    | Responsibility                                          |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------------- |
| Setup        | `CoSecConfigurer`                                           | Registers the coherent default interceptor set          |
| Token state  | `TokenStorage`, `JwtCompositeTokenSerializer`               | Persists and observes sign-in state                     |
| Refresh      | `JwtTokenManager`, `TokenRefresher`, `CoSecTokenRefresher`  | Deduplicates refresh and obtains a new token            |
| Attribution  | `DeviceIdStorage`, `SpaceIdProvider`, resource interceptor  | Adds application, device, space, and resource context   |
| Final errors | `UnauthorizedErrorInterceptor`, `ForbiddenErrorInterceptor` | Turns final 401/403 responses into application behavior |

Use `CoSecHeaders` constants instead of repeating protocol header strings. An
explicit `Authorization` request header wins so a caller can intentionally use
a different credential for one request.

## Token lifecycle and safety

`JwtToken` decodes token timing and payload fields; `JwtCompositeToken` keeps
access and refresh material together. Decoding is not signature verification.
Only the server establishes trust.

Sign-out must clear token storage and any application state derived from the
authenticated identity. Never attach CoSec to the Fetcher used by
`CoSecTokenRefresher`, or a refresh request can recursively trigger refresh.

## Source and agent reference

- Public exports: [`packages/cosec/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts)
- Detailed agent API: [`skills/fetcher-cosec-auth/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/references/api.md)
- Skill: [`$fetcher-cosec-auth`](../skills/react-and-integrations.md#fetcher-cosec-auth)

See [Add CoSec authentication](../recipes/cosec-authentication.md) for sign-in,
sign-out, space attribution, and safe testing.
