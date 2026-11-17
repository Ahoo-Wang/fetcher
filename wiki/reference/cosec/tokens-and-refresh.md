---
title: 'Tokens and refresh'
description: 'Tokens and refresh — Fetcher 6.0.0'
---

# Tokens and refresh

Token parsing is local decoding and expiration bookkeeping. It does not verify signatures, issuer, audience or permissions; the service remains the authority for authentication.

## JWT values and serialization

| API                                                         | Input/default                                                            | Return/behavior                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parseJwtPayload<T extends JwtPayload>(token)`              | Three dot-separated parts                                                | T or null; base64url/UTF-8 JSON payload decoding; parse errors logged and return null; a payload that is not a JSON object (number, string, array, null) returns null; no claim-shape validation |
| `isTokenExpired(token, earlyPeriod=0)`                      | String or CoSecJwtPayload; earlyPeriod in seconds                        | true for unparseable token (including a non-object payload), invalid/nonfinite exp, or now >= exp-earlyPeriod; absent/null exp is not expired                                                    |
| `JwtToken<Payload>(token, earlyPeriod=0)`                   | Raw string                                                               | readonly token/payload/earlyPeriod; isExpired computed against current clock                                                                                                                     |
| `JwtCompositeToken(token, earlyPeriod=0, sessionId=random)` | CompositeToken                                                           | access and refresh JwtToken; isRefreshNeeded=access expired, isRefreshable=refresh valid, authenticated=access valid                                                                             |
| `JwtCompositeTokenSerializer(earlyPeriod=0)`                | Expiry margin                                                            | serialize→JSON of raw tokens plus sessionId; deserialize→JwtCompositeToken using configured margin                                                                                               |
| `deserializeLegacy(value)`                                  | Older object containing token.accessToken and token.refreshToken strings | Rebuilds live class; throws TypeError for invalid legacy shape                                                                                                                                   |
| `jwtCompositeTokenSerializer`                               | Singleton, margin 0                                                      | Default standalone serializer                                                                                                                                                                    |

`JwtPayload` declares required jti/sub/exp/iat and optional iss/aud/nbf. `CoSecJwtPayload` adds tenantId, policies, roles, attributes and, from CoSec 8.0, the display-only session claims `sid` and `auth_time`. A client reads `roles` and `policies` as display data only: CoSec 8.0 leaves them out when empty and when the token carries `cosec.membership: "provider"`, so their absence does not mean "no roles". `IJwtToken<Payload>` combines token/payload/isExpired with `EarlyPeriodCapable`. `RefreshTokenStatusCapable` supplies readonly isRefreshNeeded/isRefreshable. `AccessToken` and `RefreshToken` are one-string-field shapes; `CompositeToken` combines them.

JSON parse failures from deserialize propagate, and a parsed value that is not a composite token (a non-array object with string accessToken and refreshToken) throws TypeError; TokenStorage then removes the stored record and reads it as absent, so no `Bearer undefined` is sent. New sign-ins receive a random sessionId; deserialization preserves a nonempty stored sessionId and derives a stable legacy identifier otherwise. The legacy identifier is session bookkeeping, not a cryptographic integrity check.

## TokenStorage

`TokenStorage(options={})` extends KeyStorage&lt;JwtCompositeToken&gt;. Options are partial KeyStorageOptions excluding serializer, plus earlyPeriod and `sharedAcrossTabs`. Defaults: key=`DEFAULT_COSEC_TOKEN_KEY` (`cosec-token`), earlyPeriod=0, a serial bus named for the actual key, wrapped in a cross-tab broadcast bus only when the storage is shared across tabs (closed by `destroy()`; a bus passed in `eventBus` stays open), and inherited environment storage. `sharedAcrossTabs` defaults to whether the storage is the browser's `localStorage`; declare `true` for another storage that every tab shares (an IndexedDB or cookie backed `Storage`) so that it gets the refresh lock and the broadcast bus too, and `false` to opt out. Declare it only when it is true. Serialization is selected internally. Instances sharing an event bus must use the same earlyPeriod or construction throws.

| Member                              | Result                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `signIn(compositeToken)`            | void; sets a new JwtCompositeToken/session                                                                           |
| `setCompositeToken(compositeToken)` | Alias for signIn                                                                                                     |
| `signOut()`                         | void; removes stored token (and the record of a refresh attempt that went with it) and emits inherited storage event |
| `authenticated`                     | true only when stored access token is not expired                                                                    |
| `currentUser`                       | CoSecJwtPayload or null; null while unauthenticated                                                                  |
| `get/set/remove/destroy/eventBus`   | Inherited KeyStorage API and cleanup ownership                                                                       |

Expiration alone does not schedule events or automatically refresh; status getters evaluate time when read. No background refresh timer is created.

## Refresh manager and transport

`new JwtTokenManager(tokenStorage, tokenRefresher, options?)` exposes the dependencies and options, currentToken (token/null), and status getters (false with no token). `refresh(exchange?): Promise<void>` rejects with Error('No token found') without a token. Concurrent refreshes for the same current token on this manager share a promise. Across tabs, for a token storage that is shared across tabs (the browser's `localStorage` by default, or `sharedAcrossTabs: true`) and where Web Locks (`navigator.locks`) exist, the refresh runs under the lock `cosec-refresh:<token storage key>`: tabs sharing that storage refresh one at a time, and a tab that waited re-reads storage first and reuses a token another tab stored for the same session instead of spending the already used refresh token; it refreshes only when storage still holds its own token (another session or a sign-out raises `RefreshSessionChangedError` without refreshing). Without Web Locks, outside a browser (a server process holds many users' storages under one key), or on a storage not declared shared, tabs refresh independently, which CoSec 8.0 punishes when they hold one pair: see [refresh under rotation](#refresh-under-rotation). Before storing a refresh result the manager re-reads storage with `tokenStorage.reload()`, since sign-in and sign-out in another tab do not take the lock and their change event may not have arrived yet: a same-session newer token wins over the late refresh result and is reused, and a sign-out or a different session in storage prevents stale writeback and raises `RefreshSessionChangedError(cause?)`.

`JwtTokenManagerOptions`:

| Option                     | Default                                                                   | Contract                                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isRefreshRejected(error)` | `isRefreshRejection`                                                      | Whether the error of a failed refresh ends the session. The default is a `401` from the refresh route (or a response that is not a composite token); every other failure keeps the session. |
| `rotationLeeway`           | `DEFAULT_ROTATION_LEEWAY`                                                 | Milliseconds (30000). **At most the server's `cosec.jwt.session.rotation-leeway`**, which the client cannot read.                                                                           |
| `refreshRetryDelays`       | `[]` (`CoSecConfigurer`: `DEFAULT_REFRESH_RETRY_DELAYS`, 500 ms then 2 s) | Pauses before the in-call retries of a refresh whose outcome is unknown, inside the window; the length is the number of retries.                                                            |

When a refresh fails, the manager re-reads storage with `tokenStorage.reload()`: if another tab has already refreshed the same session (so a one-time refresh token failed here) and stored its token, that token is reused and the request continues. A refresh response without string `accessToken` and `refreshToken` is never stored. When storage still holds the token that failed to refresh, what happens next depends on whether the server ended the session:

| Refresh failure                                                                                                                                                                                                                                                                         | Session       | Error raised                             | `onUnauthorized`                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------- | ---------------------------------- |
| The refresh endpoint answered **401** (CoSec 8.0: `token-revoked`, `token-expired` or `token-invalid`; the error carries `exchange.response.status`, as the `ExchangeError`/`HttpStatusValidationError` the refresh client rejects with does), or the response is not a composite token | Token removed | `RefreshTokenError(token, cause?)`       | Called, with the refresh's problem |
| Anything else: **429**, 400, 403, 404, 5xx, network error, timeout, abort, an error without a response                                                                                                                                                                                  | Token kept    | `RefreshUnavailableError(token, cause?)` | Not called                         |

Both errors expose `problem?: CoSecProblem`, what CoSec answered. A `429` is a rate limit, not a verdict on the session: the client does not call the route again before its `Retry-After` (at most a minute). A `token-expired` answer is also what a refresh route closed to anonymous callers gives (the access token it carries is expired, hence anonymous), and the client cannot tell the two apart. A custom `TokenRefresher` signals a rejection the same way: reject (or throw synchronously, which is handled the same) with an error whose `exchange.response.status` is 401, or pass `isRefreshRejected` for another rule. A `CoSecTokenRefresher` is recognized by a registered-symbol brand rather than `instanceof`, so one created by another copy of the package (its CommonJS build next to the ES module one) still shares a single `onUnauthorized` notification between the refresh request and the business request. After `RefreshUnavailableError` the user stays signed in and a later request refreshes again. In both errors `cause` is the refresh failure; when the refresh request failed because one of its error-interceptor callbacks (such as `onUnauthorized`) threw, `cause` is that request's `ExchangeError`, whose own `cause` is the callback error. Both errors expose the old JwtCompositeToken; avoid logging its raw credentials. A failure of the retried business request propagates unchanged and does not remove successfully refreshed credentials. The pending promise is cleared in finally. Unauthorized notification ownership is coordinated with exchange error handlers, not a general event queue.

### Refresh under rotation {#refresh-under-rotation}

CoSec 8.0 rotates a session on every refresh (`IDN-15`..`IDN-17`). The pair just replaced is answered with a pair of the current generation for `cosec.jwt.session.rotation-leeway` (30 seconds) after the move, and does not move the session again; an older pair, or that one after the leeway, **revokes the whole session**. The server moves at some time at or after the moment the client sent the request, so what the client may do depends on the time of the first attempt whose outcome it does not know (a timeout, a lost response, a 5xx: the server may have recorded the move):

| Situation                                                                          | What the client does                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First attempt of a pair                                                            | Records its time with the pair (same storage, so a reload or another tab on that storage knows it) and sends it. The time never slides.                                                                                                                                                                                                                                                                                                                     |
| Outcome unknown, **inside the window** (`rotationLeeway` less 5 s, from that time) | Retries the same pair: up to `refreshRetryDelays.length` times in the same call, and from any later request. Safe: the server answers a pair presented again within its leeway, whatever became of the first attempt.                                                                                                                                                                                                                                       |
| Outcome unknown, **after the window**                                              | **Cannot be made safe.** One attempt per call (calls are single flight), with the same pair. It saves the session if the first attempt never reached the server (a common mobile timeout); it revokes it if the server recorded it, in which case the new pair was lost and the user signs in anyway. A `401` then ends the session normally, with `token-revoked` as the problem. An operator may see such a retry in the audit as a pair presented again. |
| A refusal from the pipeline before the handler ran (`429`, `400`, `403`, ...)      | Moved nothing: resolves the attempt it started (an older unresolved one stays). A `429` is not repeated before its `Retry-After`.                                                                                                                                                                                                                                                                                                                           |
| A new pair stored, or the session ended                                            | The record of the attempt goes.                                                                                                                                                                                                                                                                                                                                                                                                                             |

`CoSecTokenRefresher` cuts a refresh request short after `DEFAULT_REFRESH_TIMEOUT` (10 seconds, its `timeout` option), so that a hung request does not use up the window. **Tabs:** two holders of one pair that each refresh it end the session at the next refresh of one of them, so a session needs one shared storage and one lock (`localStorage` with Web Locks, or `sharedAcrossTabs: true` on a storage every tab shares). `sessionStorage` (a duplicated tab starts with a copy of the pair), a per-tab in-memory storage, a custom storage not declared shared, and an insecure context without `navigator.locks` cannot be made safe: refresh in one place only. With a cross-origin browser client, a host with no CORS filter before CoSec makes a refused refresh look like a network error, which is an unknown outcome.

`TokenRefresher.refresh(token): Promise<CompositeToken>` is the custom transport contract. `CoSecTokenRefresher({fetcher, endpoint, timeout?})` requires the first two fields and POSTs the token object with JSON result extraction, cutting the request short after `timeout` (default `DEFAULT_REFRESH_TIMEOUT`, 10000 ms; 0 for none). Its concrete refresh method additionally accepts `shouldNotifyUnauthorized?: () => boolean`. It sets `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` to prevent recursive refresh; custom transports using a configured Fetcher must supply that attribute themselves.

## Complete in-memory example

This example decodes deliberately synthetic tokens locally and never contacts an authentication service. It demonstrates storage status; it does not mint valid credentials.

```ts
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const tokens = new TokenStorage({
  storage: new InMemoryStorage(),
  eventBus: new SerialTypedEventBus('example-token'),
});
const payload = {
  jti: 'demo',
  sub: 'user-1',
  iat: 0,
  exp: Math.floor(Date.now() / 1000) + 3600,
};
const jwt = `e30.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.demo`;
try {
  tokens.signIn({ accessToken: jwt, refreshToken: jwt });
  console.log(tokens.authenticated, tokens.currentUser?.sub);
  tokens.signOut();
} finally {
  tokens.destroy();
}
```

<span id="jwtpayload"></span>

**`JwtPayload`** — [packages/cosec/src/jwts.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L17)

<span id="cosecjwtpayload"></span>

**`CoSecJwtPayload`** — [packages/cosec/src/jwts.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L61)

<span id="parsejwtpayload"></span>

**`parseJwtPayload`** — [packages/cosec/src/jwts.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L95)

<span id="earlyperiodcapable"></span>

**`EarlyPeriodCapable`** — [packages/cosec/src/jwts.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L136)

<span id="istokenexpired"></span>

**`isTokenExpired`** — [packages/cosec/src/jwts.ts:159](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L159)

<span id="ijwttoken"></span>

**`IJwtToken`** — [packages/cosec/src/jwtToken.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L47)

<span id="jwttoken"></span>

**`JwtToken`** — [packages/cosec/src/jwtToken.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L82)

<span id="refreshtokenstatuscapable"></span>

**`RefreshTokenStatusCapable`** — [packages/cosec/src/jwtToken.ts:130](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L130)

<span id="jwtcompositetoken"></span>

**`JwtCompositeToken`** — [packages/cosec/src/jwtToken.ts:169](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L169)

<span id="jwtcompositetokenserializer"></span>

**`JwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:258](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L258)

<span id="jwtcompositetokenserializer-instance"></span>

**`jwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:332](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L332)

<span id="refreshtokenerror"></span>

**`RefreshTokenError`** — [packages/cosec/src/errors.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L18)

<span id="refreshsessionchangederror"></span>

**`RefreshSessionChangedError`** — [packages/cosec/src/errors.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L37)

<span id="refreshunavailableerror"></span>

**`RefreshUnavailableError`** — [packages/cosec/src/errors.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L51)

<span id="jwttokenmanager"></span>

**`JwtTokenManager`** — [packages/cosec/src/jwtTokenManager.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L140)

<span id="default_cosec_token_key"></span>

**`DEFAULT_COSEC_TOKEN_KEY`** — [packages/cosec/src/tokenStorage.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L26)

<span id="tokenstorageoptions"></span>

**`TokenStorageOptions`** — [packages/cosec/src/tokenStorage.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L47)

<span id="tokenstorage-api"></span>

**`TokenStorage`** — [packages/cosec/src/tokenStorage.ts:74](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L74)

<span id="accesstoken"></span>

**`AccessToken`** — [packages/cosec/src/tokenRefresher.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L31)

<span id="refreshtoken"></span>

**`RefreshToken`** — [packages/cosec/src/tokenRefresher.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L44)

<span id="compositetoken"></span>

**`CompositeToken`** — [packages/cosec/src/tokenRefresher.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L61)

<span id="tokenrefresher"></span>

**`TokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L77)

<span id="cosectokenrefresheroptions"></span>

**`CoSecTokenRefresherOptions`** — [packages/cosec/src/tokenRefresher.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L122)

<span id="cosectokenrefresher"></span>

**`CoSecTokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:159](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L159)

<span id="jwttokenmanageroptions"></span>

**`JwtTokenManagerOptions`** — [packages/cosec/src/jwtTokenManager.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L81)

<span id="isrefreshrejection"></span>

**`isRefreshRejection`** — [packages/cosec/src/jwtTokenManager.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L72)

<span id="default_rotation_leeway"></span>

**`DEFAULT_ROTATION_LEEWAY`** — [packages/cosec/src/jwtTokenManager.ts:110](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L110)

<span id="rotation_leeway_margin"></span>

**`ROTATION_LEEWAY_MARGIN`** — [packages/cosec/src/jwtTokenManager.ts:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L117)

<span id="default_refresh_retry_delays"></span>

**`DEFAULT_REFRESH_RETRY_DELAYS`** — [packages/cosec/src/jwtTokenManager.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L120)

<span id="default_refresh_timeout"></span>

**`DEFAULT_REFRESH_TIMEOUT`** — [packages/cosec/src/tokenRefresher.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L120)
