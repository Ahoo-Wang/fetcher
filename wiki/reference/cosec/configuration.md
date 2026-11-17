---
title: 'CoSec configuration'
description: 'CoSec configuration — Fetcher 6.0.0'
---

# CoSec configuration

`CoSecConfigurer` wires CoSec metadata, resource attribution and optional authentication into a Fetcher. It does not provide a login endpoint or server-side token verification.

Apply a setup once to a client. Interceptor registration rejects duplicate names: calling `applyTo` again does not replace the original interceptors with a new configurer's dependencies. To change authentication ownership, create a separately configured Fetcher or explicitly eject the old named interceptors after stopping its requests.

## CoSecConfig and construction

| Field                              | Default                        | Contract                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| appId?:string                      | Deprecated, ignored            | Does nothing: CoSec 8.0 does not read an app from a request, the app is the `aud` of the token; kept so existing configuration compiles, removed in the next major version                                                                                                                                                     |
| tokenStorage:TokenStorage          | new TokenStorage()             | Exposed as configurer.tokenStorage                                                                                                                                                                                                                                                                                             |
| deviceIdStorage:DeviceIdStorage    | new DeviceIdStorage()          | Exposed as configurer.deviceIdStorage                                                                                                                                                                                                                                                                                          |
| tokenRefresher:TokenRefresher      | Absent                         | Only when present creates JwtTokenManager and installs Authorization request/response interceptors                                                                                                                                                                                                                             |
| spaceIdProvider:SpaceIdProvider    | NoneSpaceIdProvider            | Resolves optional CoSec-Space-Id                                                                                                                                                                                                                                                                                               |
| isTrusted:RequestTrust             | Absent (every request trusted) | Which absolute request URLs carry the Authorization token and the CoSec headers (device ID included); `sameOriginTrust` keeps them to the `baseURL` origin and the page origin. Relative URLs on the `baseURL` host are trusted; one that URL parsing takes to another host (e.g. `\host/path`) is judged like an absolute URL |
| isRefreshRejected(error)           | A `401` from the refresh route | Whether a failed refresh ends the session; see [refresh failures](./tokens-and-refresh#refresh-manager-and-transport)                                                                                                                                                                                                          |
| rotationLeeway:number              | 30000                          | Milliseconds; **at most the server's `cosec.jwt.session.rotation-leeway`**, which the client cannot read ([refresh under rotation](./tokens-and-refresh#refresh-under-rotation))                                                                                                                                               |
| refreshRetryDelays:number[]        | [500, 2000]                    | Pauses before the in-call retries of a refresh whose outcome is unknown, inside the window; `[]` for none                                                                                                                                                                                                                      |
| onUnauthorized(exchange, problem?) | Absent                         | Optional void/Promise&lt;void&gt; callback in error pipeline; `problem` is the CoSec problem of the response, or of the refused refresh, when there is one                                                                                                                                                                     |     |
| onForbidden(exchange, problem?)    | Absent                         | Optional Promise&lt;void&gt; callback in error pipeline for a 403 (a `scope-rejected` too, when there is no `onScopeRejected`)                                                                                                                                                                                                 |
| onScopeRejected(exchange, problem) | Absent                         | Optional Promise&lt;void&gt; callback for a `403 scope-rejected`; the application decides, the client neither clears the space nor falls back to the default space                                                                                                                                                             |

`new CoSecConfigurer(config)` initializes storage immediately. `applyTo(fetcher): void` installs CoSecRequestInterceptor and ResourceAttributionRequestInterceptor unconditionally; authorization only with tokenManager; error callbacks only when configured. Merely placing tokens in tokenStorage does **not** enable Authorization injection without tokenRefresher. `isTrusted` is passed to both CoSecRequestInterceptor and AuthorizationRequestInterceptor: an untrusted request gets no CoSec headers, no Authorization and no refresh. `tokenManager` and `spaceIdProvider` are exposed readonly (declared optional); config is readonly as a reference, not deeply immutable.

::: warning Absolute URLs on other origins
Without `isTrusted`, a request to an absolute URL on any origin — a pagination link, a download URL, a callback — receives the access token and the device ID. Pass `isTrusted: sameOriginTrust` (or your own `RequestTrust`) unless every absolute URL the client requests is yours.
:::

`DeviceIdStorageCapable` and `JwtTokenManagerCapable` require their corresponding property; `AppIdCapable` is deprecated and its `appId` optional; `CoSecOptions` combines all three, while CoSecConfig permits omitted storage/refresher. They are dependency shapes, not additional setup functions.

## Complete service setup

The service must implement POST `/auth/refresh`, receiving `{accessToken, refreshToken}` and returning the same shape, answering `401` when it refuses the pair and `503` when it cannot decide; it must be reachable by an anonymous caller, since the access token it receives has expired (see [what the application must allow](../../guides/integrations/cosec#application-must-allow)). This example uses one configured Fetcher; CoSecTokenRefresher marks its own request to avoid recursive refresh. No real credentials are embedded.

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  sameOriginTrust,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSecureClient(baseURL: string) {
  const fetcher = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    isTrusted: sameOriginTrust,
    tokenRefresher: new CoSecTokenRefresher({
      fetcher,
      endpoint: '/auth/refresh',
    }),
    onUnauthorized: () => {
      console.warn('Sign-in required');
    },
    onForbidden: async () => {
      console.warn('Access denied');
    },
  });
  cosec.applyTo(fetcher);
  return {
    fetcher,
    cosec,
    signIn: (token: CompositeToken) => cosec.tokenStorage.signIn(token),
    signOut: () => cosec.tokenStorage.signOut(),
  };
}
```

## Ownership and cleanup

Keep the configured client/storages for the application/session lifetime. CoSecConfigurer has no dispose/unapply method. To dismantle an owned setup, stop requests, remove installed interceptor names from their request/response/error managers with `eject(name)`, and call `destroy()` on the owned KeyStorage instances. `destroy()` detaches the storage's internal handler and closes the broadcast bus the storage created for itself (the default of `TokenStorage` and `DeviceIdStorage`); it neither signs out nor destroys a bus passed in `eventBus`. Dispose such a shared bus separately when no other storage uses it. Do not destroy shared storages from one consumer. See [storage lifecycle](../storage/key-storage) and [interceptor behavior](./interceptors-and-attribution).

<span id="cosecconfig"></span>

**`CoSecConfig`** — [packages/cosec/src/cosecConfigurer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L88)

<span id="cosecconfigurer"></span>

**`CoSecConfigurer`** — [packages/cosec/src/cosecConfigurer.ts:396](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L396)

<span id="appidcapable"></span>

**`AppIdCapable`** — [packages/cosec/src/types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L33)

<span id="deviceidstoragecapable"></span>

**`DeviceIdStorageCapable`** — [packages/cosec/src/types.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L44)

<span id="jwttokenmanagercapable"></span>

**`JwtTokenManagerCapable`** — [packages/cosec/src/types.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L48)

<span id="cosecoptions"></span>

**`CoSecOptions`** — [packages/cosec/src/types.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L55)
