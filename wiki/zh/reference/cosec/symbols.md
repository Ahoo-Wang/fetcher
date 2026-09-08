---
next: false
title: 'cosec 公开符号索引'
description: '完整根入口导出、行为契约及源码位置索引。'
---

# cosec 公开符号索引

已知符号名时从下表定位。安装与入口选择请先看[包概览](./index.md)。

## 公开符号索引

| 符号                                             | 参考                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_NAME`         | [拦截器与资源归属](interceptors-and-attribution#authorization_request_interceptor_name)         |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`        | [拦截器与资源归属](interceptors-and-attribution#authorization_request_interceptor_order)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME`        | [拦截器与资源归属](interceptors-and-attribution#authorization_response_interceptor_name)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER`       | [拦截器与资源归属](interceptors-and-attribution#authorization_response_interceptor_order)       |
| `AUTHORIZATION_RESPONSE_MAX_RETRY`               | [拦截器与资源归属](interceptors-and-attribution#authorization_response_max_retry)               |
| `AccessToken`                                    | [Token 与刷新](tokens-and-refresh#accesstoken)                                                  |
| `AppIdCapable`                                   | [CoSec 配置](configuration#appidcapable)                                                        |
| `AuthorizationInterceptorOptions`                | [拦截器与资源归属](interceptors-and-attribution#authorizationinterceptoroptions)                |
| `AuthorizationRequestInterceptor`                | [拦截器与资源归属](interceptors-and-attribution#authorizationrequestinterceptor)                |
| `AuthorizationResponseInterceptor`               | [拦截器与资源归属](interceptors-and-attribution#authorizationresponseinterceptor)               |
| `AuthorizeResult`                                | [拦截器与资源归属](interceptors-and-attribution#authorizeresult)                                |
| `AuthorizeResults`                               | [拦截器与资源归属](interceptors-and-attribution#authorizeresults)                               |
| `COSEC_REQUEST_INTERCEPTOR_NAME`                 | [拦截器与资源归属](interceptors-and-attribution#cosec_request_interceptor_name)                 |
| `COSEC_REQUEST_INTERCEPTOR_ORDER`                | [拦截器与资源归属](interceptors-and-attribution#cosec_request_interceptor_order)                |
| `CoSecConfig`                                    | [CoSec 配置](configuration#cosecconfig)                                                         |
| `CoSecConfigurer`                                | [CoSec 配置](configuration#cosecconfigurer)                                                     |
| `CoSecHeaders`                                   | [拦截器与资源归属](interceptors-and-attribution#cosecheaders)                                   |
| `CoSecJwtPayload`                                | [Token 与刷新](tokens-and-refresh#cosecjwtpayload)                                              |
| `CoSecOptions`                                   | [CoSec 配置](configuration#cosecoptions)                                                        |
| `CoSecRequestInterceptor`                        | [拦截器与资源归属](interceptors-and-attribution#cosecrequestinterceptor)                        |
| `CoSecRequestOptions`                            | [拦截器与资源归属](interceptors-and-attribution#cosecrequestoptions)                            |
| `CoSecTokenRefresher`                            | [Token 与刷新](tokens-and-refresh#cosectokenrefresher)                                          |
| `CoSecTokenRefresherOptions`                     | [Token 与刷新](tokens-and-refresh#cosectokenrefresheroptions)                                   |
| `CompositeToken`                                 | [Token 与刷新](tokens-and-refresh#compositetoken)                                               |
| `DEFAULT_COSEC_DEVICE_ID_KEY`                    | [拦截器与资源归属](interceptors-and-attribution#default_cosec_device_id_key)                    |
| `DEFAULT_COSEC_SPACE_ID_KEY`                     | [拦截器与资源归属](interceptors-and-attribution#default_cosec_space_id_key)                     |
| `DEFAULT_COSEC_TOKEN_KEY`                        | [Token 与刷新](tokens-and-refresh#default_cosec_token_key)                                      |
| `DefaultSpaceIdProvider`                         | [拦截器与资源归属](interceptors-and-attribution#defaultspaceidprovider)                         |
| `DeviceIdStorage`                                | [拦截器与资源归属](interceptors-and-attribution#deviceidstorage)                                |
| `DeviceIdStorageCapable`                         | [CoSec 配置](configuration#deviceidstoragecapable)                                              |
| `DeviceIdStorageOptions`                         | [拦截器与资源归属](interceptors-and-attribution#deviceidstorageoptions)                         |
| `EarlyPeriodCapable`                             | [Token 与刷新](tokens-and-refresh#earlyperiodcapable)                                           |
| `FORBIDDEN_ERROR_INTERCEPTOR_NAME`               | [拦截器与资源归属](interceptors-and-attribution#forbidden_error_interceptor_name)               |
| `FORBIDDEN_ERROR_INTERCEPTOR_ORDER`              | [拦截器与资源归属](interceptors-and-attribution#forbidden_error_interceptor_order)              |
| `ForbiddenErrorInterceptor`                      | [拦截器与资源归属](interceptors-and-attribution#forbiddenerrorinterceptor)                      |
| `ForbiddenErrorInterceptorOptions`               | [拦截器与资源归属](interceptors-and-attribution#forbiddenerrorinterceptoroptions)               |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`             | [拦截器与资源归属](interceptors-and-attribution#ignore_refresh_token_attribute_key)             |
| `IJwtToken`                                      | [Token 与刷新](tokens-and-refresh#ijwttoken)                                                    |
| `IdGenerator`                                    | [拦截器与资源归属](interceptors-and-attribution#idgenerator)                                    |
| `JwtCompositeToken`                              | [Token 与刷新](tokens-and-refresh#jwtcompositetoken)                                            |
| `JwtCompositeTokenSerializer`                    | [Token 与刷新](tokens-and-refresh#jwtcompositetokenserializer)                                  |
| `JwtPayload`                                     | [Token 与刷新](tokens-and-refresh#jwtpayload)                                                   |
| `JwtToken`                                       | [Token 与刷新](tokens-and-refresh#jwttoken)                                                     |
| `JwtTokenManager`                                | [Token 与刷新](tokens-and-refresh#jwttokenmanager)                                              |
| `JwtTokenManagerCapable`                         | [CoSec 配置](configuration#jwttokenmanagercapable)                                              |
| `NanoIdGenerator`                                | [拦截器与资源归属](interceptors-and-attribution#nanoidgenerator)                                |
| `NoneSpaceIdProvider`                            | [拦截器与资源归属](interceptors-and-attribution#nonespaceidprovider)                            |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME`  | [拦截器与资源归属](interceptors-and-attribution#resource_attribution_request_interceptor_name)  |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER` | [拦截器与资源归属](interceptors-and-attribution#resource_attribution_request_interceptor_order) |
| `RefreshSessionChangedError`                     | [Token 与刷新](tokens-and-refresh#refreshsessionchangederror)                                   |
| `RefreshToken`                                   | [Token 与刷新](tokens-and-refresh#refreshtoken)                                                 |
| `RefreshTokenError`                              | [Token 与刷新](tokens-and-refresh#refreshtokenerror)                                            |
| `RefreshTokenStatusCapable`                      | [Token 与刷新](tokens-and-refresh#refreshtokenstatuscapable)                                    |
| `ResourceAttributionOptions`                     | [拦截器与资源归属](interceptors-and-attribution#resourceattributionoptions)                     |
| `ResourceAttributionRequestInterceptor`          | [拦截器与资源归属](interceptors-and-attribution#resourceattributionrequestinterceptor)          |
| `ResponseCodes`                                  | [拦截器与资源归属](interceptors-and-attribution#responsecodes)                                  |
| `SpaceIdProvider`                                | [拦截器与资源归属](interceptors-and-attribution#spaceidprovider)                                |
| `SpaceIdProviderOptions`                         | [拦截器与资源归属](interceptors-and-attribution#spaceidprovideroptions)                         |
| `SpaceIdStorage`                                 | [拦截器与资源归属](interceptors-and-attribution#spaceidstorage)                                 |
| `SpaceIdStorageOptions`                          | [拦截器与资源归属](interceptors-and-attribution#spaceidstorageoptions)                          |
| `SpacedResourcePredicate`                        | [拦截器与资源归属](interceptors-and-attribution#spacedresourcepredicate)                        |
| `TokenRefresher`                                 | [Token 与刷新](tokens-and-refresh#tokenrefresher)                                               |
| `TokenStorage`                                   | [Token 与刷新](tokens-and-refresh#tokenstorage-api)                                             |
| `TokenStorageOptions`                            | [Token 与刷新](tokens-and-refresh#tokenstorageoptions)                                          |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_NAME`            | [拦截器与资源归属](interceptors-and-attribution#unauthorized_error_interceptor_name)            |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER`           | [拦截器与资源归属](interceptors-and-attribution#unauthorized_error_interceptor_order)           |
| `UnauthorizedErrorInterceptor`                   | [拦截器与资源归属](interceptors-and-attribution#unauthorizederrorinterceptor)                   |
| `UnauthorizedErrorInterceptorOptions`            | [拦截器与资源归属](interceptors-and-attribution#unauthorizederrorinterceptoroptions)            |
| `idGenerator`                                    | [拦截器与资源归属](interceptors-and-attribution#idgenerator-instance)                           |
| `isTokenExpired`                                 | [Token 与刷新](tokens-and-refresh#istokenexpired)                                               |
| `jwtCompositeTokenSerializer`                    | [Token 与刷新](tokens-and-refresh#jwtcompositetokenserializer-instance)                         |
| `parseJwtPayload`                                | [Token 与刷新](tokens-and-refresh#parsejwtpayload)                                              |

[packages/cosec/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts#L14)
