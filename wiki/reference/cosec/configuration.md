---
title: 'CoSec configuration'
description: 'CoSec configuration — Fetcher 5.0.0'
---

# CoSec configuration

`CoSecConfigurer` wires CoSec metadata, resource attribution and optional authentication into a Fetcher. It does not provide a login endpoint or server-side token verification.

Apply a setup once to a client. Interceptor registration rejects duplicate names: calling `applyTo` again does not replace the original interceptors with a new configurer's dependencies. To change authentication ownership, create a separately configured Fetcher or explicitly eject the old named interceptors after stopping its requests.

## CoSecConfig and construction

| Field                           | Default                        | Contract                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appId:string                    | Required                       | Application identifier sent in headers                                                                                                                                                                           |
| tokenStorage:TokenStorage       | new TokenStorage()             | Exposed as configurer.tokenStorage                                                                                                                                                                               |
| deviceIdStorage:DeviceIdStorage | new DeviceIdStorage()          | Exposed as configurer.deviceIdStorage                                                                                                                                                                            |
| tokenRefresher:TokenRefresher   | Absent                         | Only when present creates JwtTokenManager and installs Authorization request/response interceptors                                                                                                               |
| spaceIdProvider:SpaceIdProvider | NoneSpaceIdProvider            | Resolves optional CoSec-Space-Id                                                                                                                                                                                 |
| isTrusted:RequestTrust          | Absent (every request trusted) | Which absolute request URLs carry the Authorization token and the CoSec headers (device ID included); `sameOriginTrust` keeps them to the `baseURL` origin and the page origin. Relative URLs are always trusted |
| onUnauthorized(exchange)        | Absent                         | Optional void/Promise&lt;void&gt; callback in error pipeline                                                                                                                                                     |
| onForbidden(exchange)           | Absent                         | Optional Promise&lt;void&gt; callback in error pipeline                                                                                                                                                          |

`new CoSecConfigurer(config)` initializes storage immediately. `applyTo(fetcher): void` installs CoSecRequestInterceptor and ResourceAttributionRequestInterceptor unconditionally; authorization only with tokenManager; error callbacks only when configured. Merely placing tokens in tokenStorage does **not** enable Authorization injection without tokenRefresher. `isTrusted` is passed to both CoSecRequestInterceptor and AuthorizationRequestInterceptor: an untrusted request gets no CoSec headers, no Authorization and no refresh. `tokenManager` and `spaceIdProvider` are exposed readonly (declared optional); config is readonly as a reference, not deeply immutable.

::: warning Absolute URLs on other origins
Without `isTrusted`, a request to an absolute URL on any origin — a pagination link, a download URL, a callback — receives the access token and the device ID. Pass `isTrusted: sameOriginTrust` (or your own `RequestTrust`) unless every absolute URL the client requests is yours.
:::

`AppIdCapable`, `DeviceIdStorageCapable`, `JwtTokenManagerCapable` require their corresponding property; `CoSecOptions` combines all three, while CoSecConfig permits omitted storage/refresher. They are dependency shapes, not additional setup functions.

## Complete service setup

The service must implement POST `/auth/refresh`, receiving `{accessToken, refreshToken}` and returning the same shape. This example uses one configured Fetcher; CoSecTokenRefresher marks its own request to avoid recursive refresh. No real credentials are embedded.

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
    appId: 'example-app',
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

**`CoSecConfig`** — [packages/cosec/src/cosecConfigurer.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L87)

<span id="cosecconfigurer"></span>

**`CoSecConfigurer`** — [packages/cosec/src/cosecConfigurer.ts:374](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L374)

<span id="appidcapable"></span>

**`AppIdCapable`** — [packages/cosec/src/types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L33)

<span id="deviceidstoragecapable"></span>

**`DeviceIdStorageCapable`** — [packages/cosec/src/types.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L40)

<span id="jwttokenmanagercapable"></span>

**`JwtTokenManagerCapable`** — [packages/cosec/src/types.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L44)

<span id="cosecoptions"></span>

**`CoSecOptions`** — [packages/cosec/src/types.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L51)
