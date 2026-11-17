---
title: Add CoSec Authentication
description: Create a browser authentication session with refresh, token ownership, and cleanup.
---

# Add CoSec Authentication

Connect a browser application to an existing CoSec service. The result is one session object for sign-in, protected requests and sign-out.

**Which CoSec this speaks.** `@ahoo-wang/fetcher-cosec` 6.x speaks CoSec 7.x. The next major version speaks **CoSec 8.0 only**: it no longer sends `CoSec-App-Id` (8.0 does not read it; the app is the token's `aud`), and it acts on 8.0's `application/problem+json` answers. Use 6.x against a CoSec 7 server.

Installation must also resolve every declared peer dependency; see the [package prerequisites](../../reference/cosec/index.md) for the complete graph. Application routes and identities below are supplied by your application, not created by installation.

## 1. Confirm the authentication contract

Install `@ahoo-wang/fetcher` and `@ahoo-wang/fetcher-cosec`. The application must already have a login flow returning JWT `accessToken` and `refreshToken` strings. In this example `POST /auth/refresh` accepts that token pair as JSON and returns a new pair, and `GET /profile` returns `{ id, name }`. These routes must match your backend. Only use the configured client for that trusted origin. `isTrusted: sameOriginTrust` below keeps the token and the device ID on the `baseURL` origin and the page origin; without it, a request to an absolute URL on any other origin — a pagination link, a download URL — receives the access token.

### What the CoSec 8.0 application must allow {#application-must-allow}

CoSec ships no login, refresh or logout endpoint: they are the application's, and the client relies on these properties of them.

- **The refresh route is reachable by an anonymous caller.** The client sends the access token that expired, and CoSec reads an expired token as anonymous. If no statement lets `Anyone` reach the refresh route, the refresh is itself `401 token-expired` and the user is signed out when the first access token expires (ten minutes by default).
- **A refresh the application refuses answers `401`; a refresh it cannot decide answers `503`.** Only a `401` from the refresh route ends the session (`RefreshTokenError`, token removed, `onUnauthorized`). A `429`, `400`, `403`, `404`, a `5xx`, a network error or a timeout keep it (`RefreshUnavailableError`). If your route refuses with another status, say so with `isRefreshRejected`.
- **`rotationLeeway`** is at most the server's `cosec.jwt.session.rotation-leeway` (30 seconds by default). The client cannot read it; see [refresh under rotation](../../reference/cosec/tokens-and-refresh#refresh-under-rotation).
- **The app is the token's `aud`.** A host that serves one app (`cosec.authorization.scope.app-id`) answers `403 scope-rejected` to a token for another app, or for none; the client does not choose the app.
- **Logout is a server call, then `signOut()`.** Forgetting the pair locally leaves it refreshable until its session ends. A tenant or app switch answers a new pair: `signIn` it.
- **CORS lets a script read a refusal.** A browser client on another origin needs a CORS filter before CoSec that allows `Authorization`, `Content-Type`, `CoSec-Device-Id`, `CoSec-Space-Id` and `CoSec-Request-Id` and exposes `CoSec-Request-Id`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` and `Retry-After`. Without it a refusal reaches the script as a network error, indistinguishable from being offline.

## 2. Create one session per application owner

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  sameOriginTrust,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSession(baseURL: string) {
  const api = new Fetcher({ baseURL });
  const refreshApi = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    isTrusted: sameOriginTrust,
    tokenRefresher: new CoSecTokenRefresher({
      fetcher: refreshApi,
      endpoint: '/auth/refresh',
    }),
    onUnauthorized: (_exchange, problem) => {
      // problem?.slug: 'unauthorized', 'token-revoked', 'token-invalid',
      // or 'token-expired' when the refresh was refused
      console.error('Sign in again', problem?.requestId);
    },
    onForbidden: async () => {
      console.error('Access denied');
    },
    onScopeRejected: async (exchange, problem) => {
      // The space of the request, or the app of the token, is not one the
      // principal may use. The application decides what to do: the client
      // does not clear the stored space or fall back to the default space.
      console.error('Scope rejected', problem.requestId);
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
      cosec.deviceIdStorage.destroy();
    },
  };
}
```

The separate refresh transport keeps refresh requests outside the protected request pipeline. `CoSecTokenRefresher` also marks requests to skip recursive refresh. Supplying a token refresher enables bearer authentication; without one the configurer only installs the base headers and resource attribution. The deprecated `appId` option is accepted and ignored.

## 3. Connect login and logout

Create `const session = createSession(yourApiOrigin)` at application startup. After successful login call `session.signIn(loginResponse)`, then await `session.loadProfile()` in your UI error boundary. On logout call `session.signOut()` and clear sensitive UI state. Never put actual token strings in source or logs.

Token parsing is not signature verification; the backend remains responsible for authorization. An explicit request Authorization header is preserved. Check [header and attribution rules](../../reference/cosec/interceptors-and-attribution) before adding space or tenant behavior.

## 4. Check refresh and failure behavior

A refusal of CoSec 8.0 is `application/problem+json` with `type` (`https://cosec.ahoo.me/problems/<slug>`), `title`, `status`, `code`, `requestId` and, when tracing captured one, `traceId`. The client reads it from a copy of the body (a `CoSecProblem`, the second argument of the callbacks, or `getCoSecProblem(error)` on the rejection) and acts on the type, not on the status alone:

| Problem type (`code`)                                       | What the client does                                                                                                                                                           | Callback                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `invalid-request` (`400`)                                   | Nothing: a defect of the request (a `CoSec-*` header sent twice with different values, an ambiguous path). The session is kept.                                                | none; the rejection carries the problem                  |
| `unauthorized` (`401`)                                      | Does not refresh: no credential was seen. The stored pair is kept.                                                                                                             | `onUnauthorized(exchange, problem)`                      |
| `token-expired` (`401`)                                     | Refreshes once and sends the request again once                                                                                                                                | `onUnauthorized` only if the refresh is refused          |
| `token-revoked`, `token-invalid` (`401`)                    | Does not refresh: the session ended or the credential is not accepted. Removes the stored pair if it is still the one that was sent (another tab may have signed in again).    | `onUnauthorized(exchange, problem)`, once                |
| `forbidden` (`403`)                                         | Nothing: the user may not                                                                                                                                                      | `onForbidden(exchange, problem)`                         |
| `scope-rejected` (`403`)                                    | Nothing: the app or the `CoSec-Space-Id` is not one the principal may use. Retrying is refused again. The space that was sent is `exchange.request.headers['CoSec-Space-Id']`. | `onScopeRejected(exchange, problem)`, else `onForbidden` |
| `too-many-requests` (`429`)                                 | Nothing, and never a sign-out. `retryAfterSeconds(response)` says how long to wait.                                                                                            | none                                                     |
| `unavailable` (`503`), `internal-error` (`500`)             | Nothing: the session is kept                                                                                                                                                   | none                                                     |
| a response with no CoSec problem, or a type it doesn't know | As before: a 401 is refreshed once, a 403 is reported to `onForbidden`                                                                                                         | `onUnauthorized(exchange)`, `onForbidden(exchange)`      |

Callbacks do not turn failed requests into successful results; catch the request rejection as well as showing a login or error screen. A request that has no token to send, and the refresh call, carry no `CoSec-Space-Id`: an anonymous request that declares a space is refused `401 unauthorized`.

A refresh that fails ends the session only when the refresh route answers `401`. Any other failure keeps it and raises `RefreshUnavailableError`, whose `problem` says what CoSec answered. A `429` also keeps the client from calling the route again before its `Retry-After`. When a refresh fails because another tab already used the one-time refresh token, the tab re-reads storage and continues with the token that tab stored.

**A refresh whose answer was lost** is retried with the same pair inside the server's leeway; a retry after it is a gamble, described in [refresh under rotation](../../reference/cosec/tokens-and-refresh#refresh-under-rotation). **Tabs** of one session must share one storage and take turns to refresh: that is `localStorage` with Web Locks (the default), or another storage you declare with `new TokenStorage({ sharedAcrossTabs: true })`. With `sessionStorage` (a duplicated tab starts with a copy of the pair), a per-tab in-memory storage, or no `navigator.locks` (an insecure context), two holders of one pair each refresh it, and the next refresh of one of them revokes the session: refresh in one place only.

Test it without a server: use in-memory token/device storage and a mocked `fetch` that answers `application/problem+json` as above. Cover a valid token, an expired access token with a valid refresh token, concurrent requests, a refresh that is refused (`401`) and one that is only rate limited (`429`), a lost refresh response, and each problem type.

## 5. Dispose the owner

The current `TokenStorage` defaults to a broadcast bus named from its storage key. Other contexts must use the matching channel and a supported messenger. This differs from plain `KeyStorage`, whose default bus is local. Broadcast delivery is notification; the refresh itself is serialized across tabs by a Web Lock, not by the broadcast.

On application shutdown, stop pending application work and call `session.dispose()`. Each storage's `destroy()` releases its handler and closes the broadcast bus it created; it does not erase tokens. Logout is a separate `signOut()` operation. Storage notifications are asynchronous: do not dispose the session immediately after sign-out while notifications are still being delivered. Closing a bus during delivery can interrupt the broadcast and log an error. Do not destroy buses shared with another owner. The configurer has no dispose method; this example retires its private Fetchers along with the session.

See [configuration](../../reference/cosec/configuration) and [token refresh and storage](../../reference/cosec/tokens-and-refresh).

[tokenStorage.ts:110](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L110) creates the default broadcast bus.

[Review integration boundaries](../../architecture/integration-decisions.md); [return to this task group](./index.md).
