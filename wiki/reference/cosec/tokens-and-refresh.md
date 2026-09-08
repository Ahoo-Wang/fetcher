---
title: 'Tokens and refresh'
description: 'Tokens and refresh — Fetcher 5.0.0'
---

# Tokens and refresh

Token parsing is local decoding and expiration bookkeeping. It does not verify signatures, issuer, audience or permissions; the service remains the authority for authentication.

## JWT values and serialization

| API                                                         | Input/default                                                            | Return/behavior                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `parseJwtPayload<T extends JwtPayload>(token)`              | Three dot-separated parts                                                | T or null; base64url/UTF-8 JSON payload decoding; parse errors logged and return null; no claim-shape validation     |
| `isTokenExpired(token, earlyPeriod=0)`                      | String or CoSecJwtPayload; earlyPeriod in seconds                        | true for unparseable token, invalid/nonfinite exp, or now >= exp-earlyPeriod; absent/null exp is not expired         |
| `JwtToken<Payload>(token, earlyPeriod=0)`                   | Raw string                                                               | readonly token/payload/earlyPeriod; isExpired computed against current clock                                         |
| `JwtCompositeToken(token, earlyPeriod=0, sessionId=random)` | CompositeToken                                                           | access and refresh JwtToken; isRefreshNeeded=access expired, isRefreshable=refresh valid, authenticated=access valid |
| `JwtCompositeTokenSerializer(earlyPeriod=0)`                | Expiry margin                                                            | serialize→JSON of raw tokens plus sessionId; deserialize→JwtCompositeToken using configured margin                   |
| `deserializeLegacy(value)`                                  | Older object containing token.accessToken and token.refreshToken strings | Rebuilds live class; throws TypeError for invalid legacy shape                                                       |
| `jwtCompositeTokenSerializer`                               | Singleton, margin 0                                                      | Default standalone serializer                                                                                        |

`JwtPayload` declares required jti/sub/exp/iat and optional iss/aud/nbf. `CoSecJwtPayload` adds tenantId, policies, roles, attributes. `IJwtToken<Payload>` combines token/payload/isExpired with `EarlyPeriodCapable`. `RefreshTokenStatusCapable` supplies readonly isRefreshNeeded/isRefreshable. `AccessToken` and `RefreshToken` are one-string-field shapes; `CompositeToken` combines them.

JSON parse failures from deserialize propagate. New sign-ins receive a random sessionId; deserialization preserves a nonempty stored sessionId and derives a stable legacy identifier otherwise. The legacy identifier is session bookkeeping, not a cryptographic integrity check.

## TokenStorage

`TokenStorage(options={})` extends KeyStorage&lt;JwtCompositeToken&gt;. Options are partial KeyStorageOptions excluding serializer, plus earlyPeriod. Defaults: key=`DEFAULT_COSEC_TOKEN_KEY` (`cosec-token`), earlyPeriod=0, a broadcast bus with serial delegate named for the actual key, and inherited environment storage. Serialization is selected internally. Instances sharing an event bus must use the same earlyPeriod or construction throws.

| Member                              | Result                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `signIn(compositeToken)`            | void; sets a new JwtCompositeToken/session                   |
| `setCompositeToken(compositeToken)` | Alias for signIn                                             |
| `signOut()`                         | void; removes stored token and emits inherited storage event |
| `authenticated`                     | true only when stored access token is not expired            |
| `currentUser`                       | CoSecJwtPayload or null; null while unauthenticated          |
| `get/set/remove/destroy/eventBus`   | Inherited KeyStorage API and cleanup ownership               |

Expiration alone does not schedule events or automatically refresh; status getters evaluate time when read. No background refresh timer is created.

## Refresh manager and transport

`new JwtTokenManager(tokenStorage, tokenRefresher)` exposes both dependencies, currentToken (token/null), and status getters (false with no token). `refresh(exchange?): Promise<void>` rejects with Error('No token found') without a token. Concurrent refreshes for the same current token on this manager share a promise; this is not a cross-tab distributed lock. A same-session newer token wins over late refresh results. Sign-out or a different session prevents stale writeback and raises `RefreshSessionChangedError(cause?)`.

An unsuccessful refresh of the still-current session removes that session's token and raises `RefreshTokenError(token, cause?)`. The error exposes the old JwtCompositeToken; avoid logging its raw credentials. A failure of the retried business request propagates unchanged and does not remove successfully refreshed credentials. The pending promise is cleared in finally. Unauthorized notification ownership is coordinated with exchange error handlers, not a general event queue.

`TokenRefresher.refresh(token): Promise<CompositeToken>` is the custom transport contract. `CoSecTokenRefresher({fetcher, endpoint})` requires both fields and POSTs the token object with JSON result extraction. Its concrete refresh method additionally accepts `shouldNotifyUnauthorized?: () => boolean`. It sets `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` to prevent recursive refresh; custom transports using a configured Fetcher must supply that attribute themselves.

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

**`parseJwtPayload`** — [packages/cosec/src/jwts.ts:91](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L91)

<span id="earlyperiodcapable"></span>

**`EarlyPeriodCapable`** — [packages/cosec/src/jwts.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L122)

<span id="istokenexpired"></span>

**`isTokenExpired`** — [packages/cosec/src/jwts.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L145)

<span id="ijwttoken"></span>

**`IJwtToken`** — [packages/cosec/src/jwtToken.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L42)

<span id="jwttoken"></span>

**`JwtToken`** — [packages/cosec/src/jwtToken.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L77)

<span id="refreshtokenstatuscapable"></span>

**`RefreshTokenStatusCapable`** — [packages/cosec/src/jwtToken.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L125)

<span id="jwtcompositetoken"></span>

**`JwtCompositeToken`** — [packages/cosec/src/jwtToken.ts:164](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L164)

<span id="jwtcompositetokenserializer"></span>

**`JwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:253](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L253)

<span id="jwtcompositetokenserializer-instance"></span>

**`jwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:325](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L325)

<span id="refreshtokenerror"></span>

**`RefreshTokenError`** — [packages/cosec/src/jwtTokenManager.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L25)

<span id="refreshsessionchangederror"></span>

**`RefreshSessionChangedError`** — [packages/cosec/src/jwtTokenManager.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L37)

<span id="jwttokenmanager"></span>

**`JwtTokenManager`** — [packages/cosec/src/jwtTokenManager.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L48)

<span id="default_cosec_token_key"></span>

**`DEFAULT_COSEC_TOKEN_KEY`** — [packages/cosec/src/tokenStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L27)

<span id="tokenstorageoptions"></span>

**`TokenStorageOptions`** — [packages/cosec/src/tokenStorage.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L48)

<span id="tokenstorage-api"></span>

**`TokenStorage`** — [packages/cosec/src/tokenStorage.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L58)

<span id="accesstoken"></span>

**`AccessToken`** — [packages/cosec/src/tokenRefresher.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L28)

<span id="refreshtoken"></span>

**`RefreshToken`** — [packages/cosec/src/tokenRefresher.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L41)

<span id="compositetoken"></span>

**`CompositeToken`** — [packages/cosec/src/tokenRefresher.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L58)

<span id="tokenrefresher"></span>

**`TokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:74](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L74)

<span id="cosectokenrefresheroptions"></span>

**`CoSecTokenRefresherOptions`** — [packages/cosec/src/tokenRefresher.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L111)

<span id="cosectokenrefresher"></span>

**`CoSecTokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:142](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L142)
