---
title: 'Cosec reference'
description: 'Cosec reference — Fetcher 5.0.0'
---

# Cosec reference

CoSec request metadata, resource attribution, JWT storage and refresh integrated into Fetcher interceptors.

## Install

```bash
pnpm add @ahoo-wang/fetcher-cosec
```

Version baseline: **5.0.0**. This package declares Node **>=18.20.8**; the repository contributor toolchain is separate. Install peer packages required by your selected runtime integration.

## Minimal example

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const cosec = new CoSecConfigurer({ appId: 'example-app' });
cosec.applyTo(fetcher);
```

CoSec without a tokenRefresher installs metadata/attribution only. Read configuration before enabling managed authentication.

## Topics

- [CoSec configuration](/reference/cosec/configuration)
- [Tokens and refresh](/reference/cosec/tokens-and-refresh)
- [Interceptors and attribution](/reference/cosec/interceptors-and-attribution)

## Public symbol index

| Symbol                                           | Reference                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_NAME`         | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorization_request_interceptor_name)         |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`        | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorization_request_interceptor_order)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME`        | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorization_response_interceptor_name)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER`       | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorization_response_interceptor_order)       |
| `AUTHORIZATION_RESPONSE_MAX_RETRY`               | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorization_response_max_retry)               |
| `AccessToken`                                    | [Tokens and refresh](/reference/cosec/tokens-and-refresh#accesstoken)                                                        |
| `AppIdCapable`                                   | [CoSec configuration](/reference/cosec/configuration#appidcapable)                                                           |
| `AuthorizationInterceptorOptions`                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorizationinterceptoroptions)                |
| `AuthorizationRequestInterceptor`                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorizationrequestinterceptor)                |
| `AuthorizationResponseInterceptor`               | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorizationresponseinterceptor)               |
| `AuthorizeResult`                                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorizeresult)                                |
| `AuthorizeResults`                               | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#authorizeresults)                               |
| `COSEC_REQUEST_INTERCEPTOR_NAME`                 | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#cosec_request_interceptor_name)                 |
| `COSEC_REQUEST_INTERCEPTOR_ORDER`                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#cosec_request_interceptor_order)                |
| `CoSecConfig`                                    | [CoSec configuration](/reference/cosec/configuration#cosecconfig)                                                            |
| `CoSecConfigurer`                                | [CoSec configuration](/reference/cosec/configuration#cosecconfigurer)                                                        |
| `CoSecHeaders`                                   | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#cosecheaders)                                   |
| `CoSecJwtPayload`                                | [Tokens and refresh](/reference/cosec/tokens-and-refresh#cosecjwtpayload)                                                    |
| `CoSecOptions`                                   | [CoSec configuration](/reference/cosec/configuration#cosecoptions)                                                           |
| `CoSecRequestInterceptor`                        | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#cosecrequestinterceptor)                        |
| `CoSecRequestOptions`                            | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#cosecrequestoptions)                            |
| `CoSecTokenRefresher`                            | [Tokens and refresh](/reference/cosec/tokens-and-refresh#cosectokenrefresher)                                                |
| `CoSecTokenRefresherOptions`                     | [Tokens and refresh](/reference/cosec/tokens-and-refresh#cosectokenrefresheroptions)                                         |
| `CompositeToken`                                 | [Tokens and refresh](/reference/cosec/tokens-and-refresh#compositetoken)                                                     |
| `DEFAULT_COSEC_DEVICE_ID_KEY`                    | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#default_cosec_device_id_key)                    |
| `DEFAULT_COSEC_SPACE_ID_KEY`                     | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#default_cosec_space_id_key)                     |
| `DEFAULT_COSEC_TOKEN_KEY`                        | [Tokens and refresh](/reference/cosec/tokens-and-refresh#default_cosec_token_key)                                            |
| `DefaultSpaceIdProvider`                         | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#defaultspaceidprovider)                         |
| `DeviceIdStorage`                                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#deviceidstorage)                                |
| `DeviceIdStorageCapable`                         | [CoSec configuration](/reference/cosec/configuration#deviceidstoragecapable)                                                 |
| `DeviceIdStorageOptions`                         | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#deviceidstorageoptions)                         |
| `EarlyPeriodCapable`                             | [Tokens and refresh](/reference/cosec/tokens-and-refresh#earlyperiodcapable)                                                 |
| `FORBIDDEN_ERROR_INTERCEPTOR_NAME`               | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#forbidden_error_interceptor_name)               |
| `FORBIDDEN_ERROR_INTERCEPTOR_ORDER`              | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#forbidden_error_interceptor_order)              |
| `ForbiddenErrorInterceptor`                      | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#forbiddenerrorinterceptor)                      |
| `ForbiddenErrorInterceptorOptions`               | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#forbiddenerrorinterceptoroptions)               |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`             | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#ignore_refresh_token_attribute_key)             |
| `IJwtToken`                                      | [Tokens and refresh](/reference/cosec/tokens-and-refresh#ijwttoken)                                                          |
| `IdGenerator`                                    | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#idgenerator)                                    |
| `JwtCompositeToken`                              | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwtcompositetoken)                                                  |
| `JwtCompositeTokenSerializer`                    | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwtcompositetokenserializer)                                        |
| `JwtPayload`                                     | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwtpayload)                                                         |
| `JwtToken`                                       | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwttoken)                                                           |
| `JwtTokenManager`                                | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwttokenmanager)                                                    |
| `JwtTokenManagerCapable`                         | [CoSec configuration](/reference/cosec/configuration#jwttokenmanagercapable)                                                 |
| `NanoIdGenerator`                                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#nanoidgenerator)                                |
| `NoneSpaceIdProvider`                            | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#nonespaceidprovider)                            |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME`  | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#resource_attribution_request_interceptor_name)  |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER` | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#resource_attribution_request_interceptor_order) |
| `RefreshSessionChangedError`                     | [Tokens and refresh](/reference/cosec/tokens-and-refresh#refreshsessionchangederror)                                         |
| `RefreshToken`                                   | [Tokens and refresh](/reference/cosec/tokens-and-refresh#refreshtoken)                                                       |
| `RefreshTokenError`                              | [Tokens and refresh](/reference/cosec/tokens-and-refresh#refreshtokenerror)                                                  |
| `RefreshTokenStatusCapable`                      | [Tokens and refresh](/reference/cosec/tokens-and-refresh#refreshtokenstatuscapable)                                          |
| `ResourceAttributionOptions`                     | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#resourceattributionoptions)                     |
| `ResourceAttributionRequestInterceptor`          | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#resourceattributionrequestinterceptor)          |
| `ResponseCodes`                                  | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#responsecodes)                                  |
| `SpaceIdProvider`                                | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#spaceidprovider)                                |
| `SpaceIdProviderOptions`                         | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#spaceidprovideroptions)                         |
| `SpaceIdStorage`                                 | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#spaceidstorage)                                 |
| `SpaceIdStorageOptions`                          | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#spaceidstorageoptions)                          |
| `SpacedResourcePredicate`                        | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#spacedresourcepredicate)                        |
| `TokenRefresher`                                 | [Tokens and refresh](/reference/cosec/tokens-and-refresh#tokenrefresher)                                                     |
| `TokenStorage`                                   | [Tokens and refresh](/reference/cosec/tokens-and-refresh#tokenstorage-api)                                                   |
| `TokenStorageOptions`                            | [Tokens and refresh](/reference/cosec/tokens-and-refresh#tokenstorageoptions)                                                |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_NAME`            | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#unauthorized_error_interceptor_name)            |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER`           | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#unauthorized_error_interceptor_order)           |
| `UnauthorizedErrorInterceptor`                   | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#unauthorizederrorinterceptor)                   |
| `UnauthorizedErrorInterceptorOptions`            | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#unauthorizederrorinterceptoroptions)            |
| `idGenerator`                                    | [Interceptors and attribution](/reference/cosec/interceptors-and-attribution#idgenerator-instance)                           |
| `isTokenExpired`                                 | [Tokens and refresh](/reference/cosec/tokens-and-refresh#istokenexpired)                                                     |
| `jwtCompositeTokenSerializer`                    | [Tokens and refresh](/reference/cosec/tokens-and-refresh#jwtcompositetokenserializer-instance)                               |
| `parseJwtPayload`                                | [Tokens and refresh](/reference/cosec/tokens-and-refresh#parsejwtpayload)                                                    |

[packages/cosec/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts#L14)

## Earlier section links

Earlier reference links still lead to the corresponding topics below.

| Earlier section | Current topic |
| --- | --- |
| <span id="install-and-choose-the-setup"></span>Install and choose the setup | [Read this topic](/reference/cosec/index.md) |
| <span id="configuration-and-minimal-safe-example"></span>Configuration and minimal safe example | [Read this topic](/reference/cosec/configuration.md) |
| <span id="token-lifecycle-and-state"></span>Token lifecycle and state | [Read this topic](/reference/cosec/tokens-and-refresh.md) |
| <span id="interceptor-pipeline-and-refresh-semantics"></span>Interceptor pipeline and refresh semantics | [Read this topic](/reference/cosec/interceptors-and-attribution.md) |
| <span id="concurrent-refresh-retry-and-errors"></span>Concurrent refresh, retry, and errors | [Read this topic](/reference/cosec/tokens-and-refresh.md) |
| <span id="cleanup-security-and-troubleshooting"></span>Cleanup, security, and troubleshooting | [Read this topic](/reference/cosec/index.md) |
| <span id="source-references"></span>Source references | [Read this topic](/reference/cosec/index.md) |
