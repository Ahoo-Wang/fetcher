# CoSec authentication — `@ahoo-wang/fetcher-cosec`

`new CoSecConfigurer(config).applyTo(fetcher)` installs interceptors that add
`CoSec-App-Id`/`CoSec-Device-Id` headers, the `Authorization: Bearer …` header,
JWT refresh with one 401 retry, `{tenantId}`/`{ownerId}` path filling, and the
401/403 callbacks. Tokens live in a `TokenStorage` (a `KeyStorage` on
`localStorage`, key `cosec-token`, synced across tabs).

## What gets installed

| Config           | Installs                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| always           | App ID / device ID headers, `{tenantId}`/`{ownerId}` filling                               |
| `tokenRefresher` | **`Authorization` header** and refresh/401 retry. Without it no bearer token is ever sent. |
| `onUnauthorized` | 401 error callback                                                                         |
| `onForbidden`    | 403 error callback (must return a `Promise`: write `async`)                                |

## Gotchas

- **No `tokenRefresher`, no `Authorization` header.** Configuring only
  `appId` and `tokenStorage` sends app/device headers and nothing else.
- **The token goes to every origin by default.** Absolute URLs on other
  origins (pagination links, signed downloads, webhooks) receive the access
  token and device ID. Pass `isTrusted: sameOriginTrust` to limit them to the
  `baseURL` origin and the page origin; relative URLs are always trusted.
- **Refresh loops.** A custom `TokenRefresher` that calls through the same
  CoSec-configured fetcher re-enters the refresh and waits on itself: requests
  hang. Mark the refresh call with
  `attributes: new Map([[IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY, true]])` (checked by
  presence, so `false` also counts), or use `CoSecTokenRefresher`, which does.
  `CoSecTokenRefresher({ fetcher, endpoint })` POSTs `{ accessToken, refreshToken }`
  and expects the same shape back; a wrapped body (`{ data: … }`) counts as an
  invalid refresh and signs the user out, so write your own refresher for other
  shapes.
- **Only a rejected refresh token signs the user out.** A 4xx from the refresh
  endpoint, or a body without string `accessToken`/`refreshToken`, removes the
  token and throws `RefreshTokenError` (then `onUnauthorized` fires). A network
  error, timeout, abort or 5xx keeps the session and throws
  `RefreshUnavailableError`; `onUnauthorized` does not fire, and the caller's
  request still rejects (an `ExchangeError` with that `cause`). Show "offline",
  not the login page. A custom refresher signals rejection by throwing an error
  whose `exchange.response.status` is the 4xx.
- **401 is retried once**, only when the request carried the injected token:
  refresh, then replay. A caller-set `Authorization` header (any value) opts
  the request out of injection and refresh. `onUnauthorized` fires for any 401
  that reaches the error phase (no token, not refreshable, refresh rejected).
- **403 never refreshes.** Neither callback clears the error: the call still
  rejects after it. A throwing callback becomes the rejection's `cause`.
- **`authenticated`/`currentUser` turn false when the access token expires**,
  even if it can still be refreshed. For "still signed in" read
  `tokenStorage.get()?.isRefreshable`. `earlyPeriod` is in **seconds**.
- **Sign in** with `tokenStorage.signIn({ accessToken, refreshToken })`; it starts
  a new session, and a refresh or retry from the old session rejects with
  `RefreshSessionChangedError`. A JWT whose payload is not a JSON object reads as
  expired; no `exp` means it never expires.
- **Tenant and owner**: keep `{tenantId}`/`{ownerId}` in the URL template; they
  are filled from the JWT's `tenantId`/`sub` when the caller did not supply them.
  With no token stored the placeholder stays empty and the request fails with
  `Missing required path parameter`.
- **Servers and SSR**: the default `TokenStorage` broadcasts on a
  `BroadcastChannel`, which Node also has: every instance in one process
  receives the others' tokens. On a server give each one a local bus:
  `new TokenStorage({ storage: new InMemoryStorage(), eventBus: new SerialTypedEventBus('cosec-token') })`.
- **Cross-tab refresh** is serialized with Web Locks; a hung refresh holds the
  lock for every tab, so give the refresh fetcher a `timeout`.

## Example

```ts
import { NamedFetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  RefreshUnavailableError,
  TokenStorage,
  sameOriginTrust,
} from '@ahoo-wang/fetcher-cosec';

export const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 10_000,
});
export const tokenStorage = new TokenStorage({ earlyPeriod: 60 });

new CoSecConfigurer({
  appId: 'my-app',
  tokenStorage,
  isTrusted: sameOriginTrust,
  tokenRefresher: new CoSecTokenRefresher({
    fetcher: apiFetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => {
    window.location.assign('/login');
  },
  onForbidden: async () => {
    console.warn('forbidden');
  },
}).applyTo(apiFetcher);

// After login:
tokenStorage.signIn({ accessToken, refreshToken });

// `{tenantId}` comes from the JWT:
const orders = await apiFetcher.get('/tenant/{tenantId}/orders');

// Offline during refresh: keep the user signed in.
function isOffline(error: unknown) {
  return (
    error instanceof Error && error.cause instanceof RefreshUnavailableError
  );
}
```
