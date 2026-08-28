---
title: Add CoSec Authentication
description: Add CoSec request headers, token storage, automatic refresh, and authorization error handling to a Fetcher.
---

# Add CoSec Authentication

`CoSecConfigurer` is the composition root for CoSec interceptors. A minimal configuration adds application, device, and request IDs; providing a token refresher also enables bearer authentication and refresh.

## Configure a trusted API client

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
  onUnauthorized: () => {
    window.location.assign('/login');
  },
  onForbidden: async () => {
    console.error('Access denied');
  },
});

cosec.applyTo(api);
```

Use a separate unconfigured Fetcher for token refresh. `CoSecTokenRefresher` marks refresh calls so authorization interceptors do not recursively refresh them.

## Sign in and sign out

Store the token pair returned by your authentication endpoint:

```ts
cosec.tokenStorage.signIn({
  accessToken: loginResponse.accessToken,
  refreshToken: loginResponse.refreshToken,
});

console.log(cosec.tokenStorage.authenticated);
console.log(cosec.tokenStorage.currentUser);
```

Sign out removes the stored pair and broadcasts the change to other contexts using the default storage event bus:

```ts
cosec.tokenStorage.signOut();
```

Never log, document, or commit real token values.

## What each request receives

The configured request interceptors add:

- `CoSec-App-Id`
- `CoSec-Device-Id`
- `CoSec-Request-Id`
- `CoSec-Space-Id` when the configured provider resolves one
- `Authorization: Bearer …` when an authenticated token exists

An explicit request Authorization header is not overwritten.

## Refresh and errors

Before a request, an expired/early access token is refreshed only when its refresh token is still valid. Concurrent refresh attempts share one in-progress promise. A refresh failure removes stored tokens and throws `RefreshTokenError`.

After a `401`, authorization response/error interceptors run according to the configuration. A `403` invokes `onForbidden` when provided. Keep UI navigation in these callbacks; keep token protocol inside the CoSec components.

## Space and resource attribution

Add a `SpaceIdProvider` only for resources whose server contract requires a space header. Resource-attribution interceptors can also resolve tenant/owner information from the request contract. Do not inject guessed tenant values globally.

## Test safely

Use in-memory storage, fixed fake JWTs, and a mocked Fetch boundary. Assert header names, refresh count, storage change, and 401/403 callbacks without contacting a real identity service.
