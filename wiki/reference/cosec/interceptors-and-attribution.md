---
title: 'Interceptors and attribution'
description: 'Interceptors and attribution — Fetcher 6.0.0'
---

# Interceptors and attribution

These interceptors enrich or retry a FetchExchange. Register each with the matching request, response or error manager using `.use(instance)`. The [configurer](./configuration) installs the common combination.

## Actual execution flow

1. CoSecRequestInterceptor skips a request that [`isTrusted`](#request-trust) rejects; otherwise it sets application/device/request headers and a truthy resolved space ID. The space is resolved once per exchange: a 401 retry is sent to the space the request was first sent to, even if the current space changed during the refresh; later requests use the current space.
2. AuthorizationRequestInterceptor skips an untrusted request (no Authorization, no refresh) and preserves an existing Authorization header; otherwise it checks session ownership, refreshes when access is expired and refresh is valid, then injects the managed Bearer token.
3. ResourceAttributionRequestInterceptor fills tenant/owner URL path parameters before URL resolution, looking for the placeholders in the template the request is resolved from: the Fetcher `baseURL` joined with the request URL, or the request URL alone when it is absolute. The core transport sends the request.
4. AuthorizationResponseInterceptor handles a managed-credential 401 before normal status validation. The 401 of a request `isTrusted` rejected (sent without this application's credentials) is returned as is: no refresh, no replay, no onUnauthorized. For a managed 401 it releases the unread 401 body (so it holds no connection the refresh and retry need), refreshes, deletes only its injected stale credential, and re-executes the full exchange pipeline at most once. The retry's own outcome replaces the 401: if its fetch fails (offline, timeout, abort), the request fails with that error, `exchange.response` is undefined and onUnauthorized is not called. A request whose body is a `ReadableStream` (or another async iterable) cannot be sent again: the session is still refreshed, and the request fails with `NonReplayableRequestError` (not notified) so the caller can re-send it with a new body.
5. Remaining failures reach error interceptors. Unauthorized handles 401/RefreshTokenError with notification ownership guards (a `RefreshUnavailableError` — the refresh could not reach the server — keeps the session and is not notified); Forbidden handles 403. Neither callback automatically recovers the failed request.

The request/response managers sort order values; registration order alone is not the execution contract. Re-executing the pipeline can create a new CoSec request ID. Caller-provided Authorization values are not replaced or automatically refreshed. A token may still be attached when access is expired and refresh is unavailable; the server decides the resulting status.

```mermaid
sequenceDiagram
  autonumber
  participant App
  participant Fetcher
  participant Tokens
  participant Service
  App->>Fetcher: Request
  Fetcher->>Tokens: Read managed session
  opt Expired access and valid refresh
    Tokens->>Service: POST refresh
    Service-->>Tokens: CompositeToken
  end
  Fetcher->>Service: Request with managed Authorization
  Service-->>Fetcher: Response
  opt Managed 401, retry not yet used
    Fetcher->>Tokens: Refresh same session
    Tokens-->>Fetcher: Current token or error
    Fetcher->>Service: Re-run exchange once
    Service-->>Fetcher: Retry response
  end
  Fetcher-->>App: Extracted result or error
```

## Interceptor parameters and results

| Export                                                                 | Constructor options                                                                               | intercept(exchange)                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CoSecRequestInterceptor` / `CoSecRequestOptions`                      | appId, deviceIdStorage required; spaceIdProvider defaults NoneSpaceIdProvider; optional isTrusted | Promise&lt;void&gt;; nothing for an untrusted request; otherwise overwrites app/device/request headers; writes space only for a truthy ID; storage/provider failures propagate                                                                      |
| `AuthorizationRequestInterceptor` / `AuthorizationInterceptorOptions`  | tokenManager required (JwtTokenManagerCapable); optional isTrusted                                | Promise&lt;void&gt;; nothing for an untrusted request; preserves explicit Authorization, refreshes managed token when needed                                                                                                                        |
| `AuthorizationResponseInterceptor`                                     | Same AuthorizationInterceptorOptions                                                              | Promise&lt;void&gt;; only 401 of a trusted request, only matching managed credential, at most AUTHORIZATION_RESPONSE_MAX_RETRY=1; a one-shot body fails with NonReplayableRequestError                                                              |
| `ResourceAttributionRequestInterceptor` / `ResourceAttributionOptions` | tokenStorage required; tenantId='tenantId', ownerId='ownerId' are **placeholder names**           | void; takes tenantId/sub from decoded access payload; fills matching template fields of the baseURL + request URL template (the request URL alone when absolute) only when current path value is falsy                                              |
| `UnauthorizedErrorInterceptor` / options                               | onUnauthorized required, returns void or Promise&lt;void&gt;                                      | Promise&lt;void&gt;; skips RefreshSessionChangedError, RefreshUnavailableError, NonReplayableRequestError, requests `isTrusted` rejected, and duplicate/obsolete notifications; a callback error becomes the exchange error (`ExchangeError` cause) |
| `ForbiddenErrorInterceptor` / options                                  | onForbidden required, returns Promise&lt;void&gt;                                                 | Promise&lt;void&gt;; callback runs only for response.status=403; a callback error becomes the exchange error (`ExchangeError` cause)                                                                                                                |

`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` is `Ignore-Refresh-Token`. **Presence**, even with false, disables automatic proactive/401 refresh. It does not suppress Authorization injection or disable ordinary HTTP status errors.

## Request trust {#request-trust}

`RequestTrust` is `(url: string, exchange: FetchExchange) => boolean`; `RequestTrustCapable` adds the optional `isTrusted` to `CoSecConfig`, `CoSecRequestOptions` and `AuthorizationInterceptorOptions`. `isTrustedRequest(exchange, isTrusted?)` decides for both request interceptors: without `isTrusted` every request is trusted; with it a relative request URL is trusted when, joined to the `baseURL`, it stays on the `baseURL`'s scheme and host, and an absolute one only when `isTrusted(url, exchange)` returns true. A relative URL that URL parsing takes to another host — `\host/path`, mixed slashes, or tabs and newlines the parser strips — is judged like an absolute URL: `isTrusted` receives the URL it resolves to (against the page, or a placeholder origin without one). The decision is made once per exchange (per predicate) and kept on it: the 401 retry, which sees the URL already resolved against the `baseURL`, reuses it, so a trusted relative request keeps its credentials on the retry and `isTrusted` is asked once per request. `sameOriginTrust` trusts an absolute URL on the origin of the fetcher's `baseURL` or on the page's own origin; every other origin, and a URL that does not parse, is untrusted.

::: warning Default trusts every origin
By default an absolute request URL on any origin receives the access token and the CoSec headers, device ID included. Configure `isTrusted: sameOriginTrust` (or your own predicate) when the client requests URLs it does not control, such as pagination links, download URLs or callbacks.
:::

## Device and space selection

`DeviceIdStorage(options={})` and `SpaceIdStorage(options={})` extend KeyStorage&lt;string&gt;. Options are partial KeyStorageOptions; each forces its identity serializer. Their default keys are `cosec-device-id` and `cosec-space-id`; default buses are serial buses named for the actual key, broadcast across tabs only when the storage is the browser's `localStorage`, and `destroy()` closes such a default bus; a bus passed in `eventBus` stays open. Storage selection is inherited from KeyStorage. Custom event buses/storage can be injected; cleanup follows [KeyStorage](../storage/key-storage).

`DeviceIdStorage.generateDeviceId(): string` calls the exported `idGenerator`, but does not store the result. `getOrCreate(): string` returns a truthy stored ID or generates/stores a new one. `IdGenerator.generateId(): string` is implemented by `NanoIdGenerator` with nanoid; `idGenerator` is its shared instance.

`SpaceIdProvider.resolveSpaceId(exchange): string | null` is synchronous. `NoneSpaceIdProvider` always returns null. `DefaultSpaceIdProvider({ spacedResourcePredicate, spaceIdStorage })` requires both; calls `SpacedResourcePredicate.test(exchange): boolean`, returning stored space only for a match. It does not infer space from URLs or tokens without your predicate/storage.

## Constants and authorization data

| Export family                                               | Value                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `COSEC_REQUEST_INTERCEPTOR_NAME/ORDER`                      | CoSecRequestInterceptor / Number.MIN_SAFE_INTEGER + DEFAULT_INTERCEPTOR_ORDER_STEP                                                |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_NAME/ORDER`              | AuthorizationRequestInterceptor / COSEC_REQUEST_INTERCEPTOR_ORDER + DEFAULT_INTERCEPTOR_ORDER_STEP                                |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME/ORDER`             | AuthorizationResponseInterceptor / Number.MIN_SAFE_INTEGER + 1000                                                                 |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME/ORDER`       | ResourceAttributionRequestInterceptor / URL_RESOLVE_INTERCEPTOR_ORDER - DEFAULT_INTERCEPTOR_ORDER_STEP                            |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_NAME/ORDER`                 | UnauthorizedErrorInterceptor / 0                                                                                                  |
| `FORBIDDEN_ERROR_INTERCEPTOR_NAME/ORDER`                    | ForbiddenErrorInterceptor / 0                                                                                                     |
| `DEFAULT_COSEC_DEVICE_ID_KEY`, `DEFAULT_COSEC_SPACE_ID_KEY` | cosec-device-id, cosec-space-id                                                                                                   |
| `CoSecHeaders` static fields                                | DEVICE_ID=CoSec-Device-Id, APP_ID=CoSec-App-Id, SPACE_ID=CoSec-Space-Id, AUTHORIZATION=Authorization, REQUEST_ID=CoSec-Request-Id |
| `ResponseCodes`                                             | UNAUTHORIZED=401, FORBIDDEN=403                                                                                                   |

`AuthorizeResult` is `{ authorized:boolean, reason:string }`. `AuthorizeResults` contains ALLOW (true, 'Allow'), EXPLICIT_DENY ('Explicit Deny'), IMPLICIT_DENY ('Implicit Deny'), TOKEN_EXPIRED ('Token Expired'), TOO_MANY_REQUESTS ('Too Many Requests'); all except ALLOW have authorized=false. These are result objects, not a local policy engine or server status-code mapper.

## Complete space configuration

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  DefaultSpaceIdProvider,
  SpaceIdStorage,
  TokenStorage,
  DeviceIdStorage,
} from '@ahoo-wang/fetcher-cosec';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const spaces = new SpaceIdStorage({
  storage: new InMemoryStorage(),
  eventBus: new SerialTypedEventBus('example-space'),
});
spaces.set('workspace-1');
const provider = new DefaultSpaceIdProvider({
  spaceIdStorage: spaces,
  spacedResourcePredicate: {
    test: exchange => exchange.request.url.startsWith('/projects'),
  },
});
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const cosec = new CoSecConfigurer({
  appId: 'example-app',
  spaceIdProvider: provider,
  tokenStorage: new TokenStorage({
    storage: new InMemoryStorage(),
    eventBus: new SerialTypedEventBus('example-token'),
  }),
  deviceIdStorage: new DeviceIdStorage({
    storage: new InMemoryStorage(),
    eventBus: new SerialTypedEventBus('example-device'),
  }),
});
cosec.applyTo(fetcher);
// No request is made by constructing this configuration.
spaces.destroy();
cosec.tokenStorage.destroy();
cosec.deviceIdStorage.destroy();
```

<span id="authorizationinterceptoroptions"></span>

**`AuthorizationInterceptorOptions`** — [packages/cosec/src/authorizationRequestInterceptor.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L31)

<span id="authorization_request_interceptor_name"></span>

**`AUTHORIZATION_REQUEST_INTERCEPTOR_NAME`** — [packages/cosec/src/authorizationRequestInterceptor.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L34)

<span id="authorization_request_interceptor_order"></span>

**`AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`** — [packages/cosec/src/authorizationRequestInterceptor.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L36)

<span id="authorizationrequestinterceptor"></span>

**`AuthorizationRequestInterceptor`** — [packages/cosec/src/authorizationRequestInterceptor.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L49)

<span id="authorization_response_interceptor_name"></span>

**`AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME`** — [packages/cosec/src/authorizationResponseInterceptor.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L41)

<span id="authorization_response_interceptor_order"></span>

**`AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER`** — [packages/cosec/src/authorizationResponseInterceptor.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L48)

<span id="authorization_response_max_retry"></span>

**`AUTHORIZATION_RESPONSE_MAX_RETRY`** — [packages/cosec/src/authorizationResponseInterceptor.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L57)

<span id="authorizationresponseinterceptor"></span>

**`AuthorizationResponseInterceptor`** — [packages/cosec/src/authorizationResponseInterceptor.ts:76](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L76)

<span id="nonreplayablerequesterror"></span>

**`NonReplayableRequestError`** — [packages/cosec/src/errors.ts:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L66)

<span id="cosecrequestoptions"></span>

**`CoSecRequestOptions`** — [packages/cosec/src/cosecRequestInterceptor.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecRequestInterceptor.ts#L62)

<span id="cosec_request_interceptor_name"></span>

**`COSEC_REQUEST_INTERCEPTOR_NAME`** — [packages/cosec/src/cosecRequestInterceptor.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecRequestInterceptor.ts#L88)

<span id="cosec_request_interceptor_order"></span>

**`COSEC_REQUEST_INTERCEPTOR_ORDER`** — [packages/cosec/src/constants.ts:46](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/constants.ts#L46)

<span id="ignore_refresh_token_attribute_key"></span>

**`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`** — [packages/cosec/src/constants.ts:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/constants.ts#L73)

<span id="cosecrequestinterceptor"></span>

**`CoSecRequestInterceptor`** — [packages/cosec/src/cosecRequestInterceptor.ts:180](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecRequestInterceptor.ts#L180)

<span id="requesttrust"></span>

**`RequestTrust`** — [packages/cosec/src/requestTrust.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/requestTrust.ts#L32)

<span id="requesttrustcapable"></span>

**`RequestTrustCapable`** — [packages/cosec/src/requestTrust.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/requestTrust.ts#L34)

<span id="sameorigintrust"></span>

**`sameOriginTrust`** — [packages/cosec/src/requestTrust.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/requestTrust.ts#L98)

<span id="istrustedrequest"></span>

**`isTrustedRequest`** — [packages/cosec/src/requestTrust.ts:114](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/requestTrust.ts#L114)

<span id="default_cosec_device_id_key"></span>

**`DEFAULT_COSEC_DEVICE_ID_KEY`** — [packages/cosec/src/deviceIdStorage.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/deviceIdStorage.ts#L22)

<span id="deviceidstorageoptions"></span>

**`DeviceIdStorageOptions`** — [packages/cosec/src/deviceIdStorage.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/deviceIdStorage.ts#L25)

<span id="deviceidstorage"></span>

**`DeviceIdStorage`** — [packages/cosec/src/deviceIdStorage.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/deviceIdStorage.ts#L32)

<span id="idgenerator"></span>

**`IdGenerator`** — [packages/cosec/src/idGenerator.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/idGenerator.ts#L16)

<span id="nanoidgenerator"></span>

**`NanoIdGenerator`** — [packages/cosec/src/idGenerator.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/idGenerator.ts#L24)

<span id="idgenerator-instance"></span>

**`idGenerator`** — [packages/cosec/src/idGenerator.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/idGenerator.ts#L35)

<span id="resourceattributionoptions"></span>

**`ResourceAttributionOptions`** — [packages/cosec/src/resourceAttributionRequestInterceptor.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L29)

<span id="resource_attribution_request_interceptor_name"></span>

**`RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME`** — [packages/cosec/src/resourceAttributionRequestInterceptor.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L47)

<span id="resource_attribution_request_interceptor_order"></span>

**`RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER`** — [packages/cosec/src/resourceAttributionRequestInterceptor.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L55)

<span id="resourceattributionrequestinterceptor"></span>

**`ResourceAttributionRequestInterceptor`** — [packages/cosec/src/resourceAttributionRequestInterceptor.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L63)

<span id="spaceidprovider"></span>

**`SpaceIdProvider`** — [packages/cosec/src/spaceIdProvider.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L67)

<span id="nonespaceidprovider"></span>

**`NoneSpaceIdProvider`** — [packages/cosec/src/spaceIdProvider.ts:123](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L123)

<span id="default_cosec_space_id_key"></span>

**`DEFAULT_COSEC_SPACE_ID_KEY`** — [packages/cosec/src/spaceIdProvider.ts:134](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L134)

<span id="spaceidstorageoptions"></span>

**`SpaceIdStorageOptions`** — [packages/cosec/src/spaceIdProvider.ts:169](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L169)

<span id="spaceidstorage"></span>

**`SpaceIdStorage`** — [packages/cosec/src/spaceIdProvider.ts:210](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L210)

<span id="spacedresourcepredicate"></span>

**`SpacedResourcePredicate`** — [packages/cosec/src/spaceIdProvider.ts:289](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L289)

<span id="spaceidprovideroptions"></span>

**`SpaceIdProviderOptions`** — [packages/cosec/src/spaceIdProvider.ts:318](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L318)

<span id="defaultspaceidprovider"></span>

**`DefaultSpaceIdProvider`** — [packages/cosec/src/spaceIdProvider.ts:375](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/spaceIdProvider.ts#L375)

<span id="cosecheaders"></span>

**`CoSecHeaders`** — [packages/cosec/src/types.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L20)

<span id="responsecodes"></span>

**`ResponseCodes`** — [packages/cosec/src/types.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L28)

<span id="authorizeresult"></span>

**`AuthorizeResult`** — [packages/cosec/src/types.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L57)

<span id="authorizeresults"></span>

**`AuthorizeResults`** — [packages/cosec/src/types.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L65)

<span id="unauthorized_error_interceptor_name"></span>

**`UNAUTHORIZED_ERROR_INTERCEPTOR_NAME`** — [packages/cosec/src/constants.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/constants.ts#L23)

<span id="unauthorized_error_interceptor_order"></span>

**`UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER`** — [packages/cosec/src/unauthorizedErrorInterceptor.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/unauthorizedErrorInterceptor.ts#L32)

<span id="unauthorizederrorinterceptoroptions"></span>

**`UnauthorizedErrorInterceptorOptions`** — [packages/cosec/src/unauthorizedErrorInterceptor.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/unauthorizedErrorInterceptor.ts#L37)

<span id="unauthorizederrorinterceptor"></span>

**`UnauthorizedErrorInterceptor`** — [packages/cosec/src/unauthorizedErrorInterceptor.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/unauthorizedErrorInterceptor.ts#L77)

<span id="forbidden_error_interceptor_name"></span>

**`FORBIDDEN_ERROR_INTERCEPTOR_NAME`** — [packages/cosec/src/forbiddenErrorInterceptor.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/forbiddenErrorInterceptor.ts#L21)

<span id="forbidden_error_interceptor_order"></span>

**`FORBIDDEN_ERROR_INTERCEPTOR_ORDER`** — [packages/cosec/src/forbiddenErrorInterceptor.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/forbiddenErrorInterceptor.ts#L27)

<span id="forbiddenerrorinterceptoroptions"></span>

**`ForbiddenErrorInterceptorOptions`** — [packages/cosec/src/forbiddenErrorInterceptor.ts:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/forbiddenErrorInterceptor.ts#L32)

<span id="forbiddenerrorinterceptor"></span>

**`ForbiddenErrorInterceptor`** — [packages/cosec/src/forbiddenErrorInterceptor.ts:113](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/forbiddenErrorInterceptor.ts#L113)
