---
title: Add CoSec Authentication
description: Create a browser authentication session with refresh, token ownership, and cleanup.
---

# Add CoSec Authentication

Connect a browser application to an existing CoSec service. The result is one session object for sign-in, protected requests and sign-out.

Installation must also resolve every declared peer dependency; see the [package prerequisites](../../reference/cosec/index.md) for the complete graph. Application routes and identities below are supplied by your application, not created by installation.

## 1. Confirm the authentication contract

Install `@ahoo-wang/fetcher` and `@ahoo-wang/fetcher-cosec`. The application must already have a login flow returning JWT `accessToken` and `refreshToken` strings. In this example `POST /auth/refresh` accepts that token pair as JSON and returns a new pair, and `GET /profile` returns `{ id, name }`. These routes and the app ID must match your backend. Only use the configured client for that trusted origin.

## 2. Create one session per application owner

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSession(baseURL: string) {
  const api = new Fetcher({ baseURL });
  const refreshApi = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    appId: 'developer-console',
    tokenRefresher: new CoSecTokenRefresher({
      fetcher: refreshApi,
      endpoint: '/auth/refresh',
    }),
    onUnauthorized: () => {
      console.error('Sign in again');
    },
    onForbidden: async () => {
      console.error('Access denied');
    },
  });
  cosec.applyTo(api);

  return {
    signIn(tokens: CompositeToken) {
      cosec.tokenStorage.signIn(tokens);
    },
    signOut() {
      cosec.tokenStorage.signOut();
    },
    async loadProfile() {
      return api.get<{ id: string; name: string }>(
        '/profile',
        {},
        { resultExtractor: ResultExtractors.Json },
      );
    },
    dispose() {
      cosec.tokenStorage.destroy();
      cosec.tokenStorage.eventBus.destroy();
      cosec.deviceIdStorage.destroy();
      cosec.deviceIdStorage.eventBus.destroy();
    },
  };
}
```

The separate refresh transport keeps refresh requests outside the protected request pipeline. `CoSecTokenRefresher` also marks requests to skip recursive refresh. Supplying a token refresher enables bearer authentication; `appId` alone only installs the base headers and resource attribution.

## 3. Connect login and logout

Create `const session = createSession(yourApiOrigin)` at application startup. After successful login call `session.signIn(loginResponse)`, then await `session.loadProfile()` in your UI error boundary. On logout call `session.signOut()` and clear sensitive UI state. Never put actual token strings in source or logs.

Token parsing is not signature verification; the backend remains responsible for authorization. An explicit request Authorization header is preserved. Check [header and attribution rules](../../reference/cosec/interceptors-and-attribution) before adding space or tenant behavior.

## 4. Check refresh and failure behavior

Use in-memory token/device storage and mocked fetch in a test. Cover a valid token, an expired access token with a valid refresh token, concurrent requests, refresh failure, and 401/403 responses. Refresh concurrency is shared by a token manager, not a cross-tab distributed lock. Refresh failure can clear the current session; callbacks do not turn failed requests into successful results. Catch the request rejection as well as showing a login/error screen.

## 5. Dispose the owner

The current `TokenStorage` defaults to a broadcast bus named from its storage key. Other contexts must use the matching channel and a supported messenger. This differs from plain `KeyStorage`, whose default bus is local. Broadcast delivery is notification, not transactional cross-tab refresh coordination.

On application shutdown, stop pending application work and call `session.dispose()`. This releases this example's owned storage handlers and buses; it does not erase tokens. Logout is a separate `signOut()` operation. Storage notifications are asynchronous: do not dispose the session immediately after sign-out while notifications are still being delivered. Closing a bus during delivery can interrupt the broadcast and log an error. Do not destroy buses shared with another owner. The configurer has no dispose method; this example retires its private Fetchers along with the session.

See [configuration](../../reference/cosec/configuration) and [token refresh and storage](../../reference/cosec/tokens-and-refresh).

[tokenStorage.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L94) creates the default broadcast bus.

[Review integration boundaries](../../architecture/integration-decisions.md); [return to this task group](./index.md).
