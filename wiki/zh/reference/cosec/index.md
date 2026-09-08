---
title: 'Cosec 参考'
description: 'Cosec 参考 — Fetcher 5.0.0'
---

# Cosec 参考

将 CoSec 请求元数据、资源归属、JWT 存储及刷新接入 Fetcher 拦截器。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-cosec
```

版本基线：**5.0.0**。本包声明 Node **>=18.20.8**；仓库贡献者工具链另行规定。按所选运行时集成安装需要的 peer 包。

## 最小示例

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const cosec = new CoSecConfigurer({ appId: 'example-app' });
cosec.applyTo(fetcher);
```

没有 tokenRefresher 时 CoSec 仅安装元数据/归属处理。启用受管理鉴权前请阅读配置页。

## 专题

- [CoSec 配置](/zh/reference/cosec/configuration)
- [Token 与刷新](/zh/reference/cosec/tokens-and-refresh)
- [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution)

## 公开符号索引

| 符号                                             | 参考                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_NAME`         | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorization_request_interceptor_name)         |
| `AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER`        | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorization_request_interceptor_order)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME`        | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorization_response_interceptor_name)        |
| `AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER`       | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorization_response_interceptor_order)       |
| `AUTHORIZATION_RESPONSE_MAX_RETRY`               | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorization_response_max_retry)               |
| `AccessToken`                                    | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#accesstoken)                                                  |
| `AppIdCapable`                                   | [CoSec 配置](/zh/reference/cosec/configuration#appidcapable)                                                        |
| `AuthorizationInterceptorOptions`                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorizationinterceptoroptions)                |
| `AuthorizationRequestInterceptor`                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorizationrequestinterceptor)                |
| `AuthorizationResponseInterceptor`               | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorizationresponseinterceptor)               |
| `AuthorizeResult`                                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorizeresult)                                |
| `AuthorizeResults`                               | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#authorizeresults)                               |
| `COSEC_REQUEST_INTERCEPTOR_NAME`                 | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#cosec_request_interceptor_name)                 |
| `COSEC_REQUEST_INTERCEPTOR_ORDER`                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#cosec_request_interceptor_order)                |
| `CoSecConfig`                                    | [CoSec 配置](/zh/reference/cosec/configuration#cosecconfig)                                                         |
| `CoSecConfigurer`                                | [CoSec 配置](/zh/reference/cosec/configuration#cosecconfigurer)                                                     |
| `CoSecHeaders`                                   | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#cosecheaders)                                   |
| `CoSecJwtPayload`                                | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#cosecjwtpayload)                                              |
| `CoSecOptions`                                   | [CoSec 配置](/zh/reference/cosec/configuration#cosecoptions)                                                        |
| `CoSecRequestInterceptor`                        | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#cosecrequestinterceptor)                        |
| `CoSecRequestOptions`                            | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#cosecrequestoptions)                            |
| `CoSecTokenRefresher`                            | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#cosectokenrefresher)                                          |
| `CoSecTokenRefresherOptions`                     | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#cosectokenrefresheroptions)                                   |
| `CompositeToken`                                 | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#compositetoken)                                               |
| `DEFAULT_COSEC_DEVICE_ID_KEY`                    | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#default_cosec_device_id_key)                    |
| `DEFAULT_COSEC_SPACE_ID_KEY`                     | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#default_cosec_space_id_key)                     |
| `DEFAULT_COSEC_TOKEN_KEY`                        | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#default_cosec_token_key)                                      |
| `DefaultSpaceIdProvider`                         | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#defaultspaceidprovider)                         |
| `DeviceIdStorage`                                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#deviceidstorage)                                |
| `DeviceIdStorageCapable`                         | [CoSec 配置](/zh/reference/cosec/configuration#deviceidstoragecapable)                                              |
| `DeviceIdStorageOptions`                         | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#deviceidstorageoptions)                         |
| `EarlyPeriodCapable`                             | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#earlyperiodcapable)                                           |
| `FORBIDDEN_ERROR_INTERCEPTOR_NAME`               | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#forbidden_error_interceptor_name)               |
| `FORBIDDEN_ERROR_INTERCEPTOR_ORDER`              | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#forbidden_error_interceptor_order)              |
| `ForbiddenErrorInterceptor`                      | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#forbiddenerrorinterceptor)                      |
| `ForbiddenErrorInterceptorOptions`               | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#forbiddenerrorinterceptoroptions)               |
| `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY`             | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#ignore_refresh_token_attribute_key)             |
| `IJwtToken`                                      | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#ijwttoken)                                                    |
| `IdGenerator`                                    | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#idgenerator)                                    |
| `JwtCompositeToken`                              | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwtcompositetoken)                                            |
| `JwtCompositeTokenSerializer`                    | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwtcompositetokenserializer)                                  |
| `JwtPayload`                                     | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwtpayload)                                                   |
| `JwtToken`                                       | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwttoken)                                                     |
| `JwtTokenManager`                                | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwttokenmanager)                                              |
| `JwtTokenManagerCapable`                         | [CoSec 配置](/zh/reference/cosec/configuration#jwttokenmanagercapable)                                              |
| `NanoIdGenerator`                                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#nanoidgenerator)                                |
| `NoneSpaceIdProvider`                            | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#nonespaceidprovider)                            |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME`  | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#resource_attribution_request_interceptor_name)  |
| `RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER` | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#resource_attribution_request_interceptor_order) |
| `RefreshSessionChangedError`                     | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#refreshsessionchangederror)                                   |
| `RefreshToken`                                   | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#refreshtoken)                                                 |
| `RefreshTokenError`                              | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#refreshtokenerror)                                            |
| `RefreshTokenStatusCapable`                      | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#refreshtokenstatuscapable)                                    |
| `ResourceAttributionOptions`                     | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#resourceattributionoptions)                     |
| `ResourceAttributionRequestInterceptor`          | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#resourceattributionrequestinterceptor)          |
| `ResponseCodes`                                  | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#responsecodes)                                  |
| `SpaceIdProvider`                                | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#spaceidprovider)                                |
| `SpaceIdProviderOptions`                         | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#spaceidprovideroptions)                         |
| `SpaceIdStorage`                                 | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#spaceidstorage)                                 |
| `SpaceIdStorageOptions`                          | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#spaceidstorageoptions)                          |
| `SpacedResourcePredicate`                        | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#spacedresourcepredicate)                        |
| `TokenRefresher`                                 | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#tokenrefresher)                                               |
| `TokenStorage`                                   | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#tokenstorage-api)                                             |
| `TokenStorageOptions`                            | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#tokenstorageoptions)                                          |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_NAME`            | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#unauthorized_error_interceptor_name)            |
| `UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER`           | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#unauthorized_error_interceptor_order)           |
| `UnauthorizedErrorInterceptor`                   | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#unauthorizederrorinterceptor)                   |
| `UnauthorizedErrorInterceptorOptions`            | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#unauthorizederrorinterceptoroptions)            |
| `idGenerator`                                    | [拦截器与资源归属](/zh/reference/cosec/interceptors-and-attribution#idgenerator-instance)                           |
| `isTokenExpired`                                 | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#istokenexpired)                                               |
| `jwtCompositeTokenSerializer`                    | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#jwtcompositetokenserializer-instance)                         |
| `parseJwtPayload`                                | [Token 与刷新](/zh/reference/cosec/tokens-and-refresh#parsejwtpayload)                                              |

[packages/cosec/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts#L14)

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="安装与选择配置"></span>安装与选择配置 | [阅读对应专题](/zh/reference/cosec/index.md) |
| <span id="配置与最小安全示例"></span>配置与最小安全示例 | [阅读对应专题](/zh/reference/cosec/configuration.md) |
| <span id="token-生命周期与状态"></span>Token 生命周期与状态 | [阅读对应专题](/zh/reference/cosec/tokens-and-refresh.md) |
| <span id="interceptor-pipeline-与刷新语义"></span>Interceptor Pipeline 与刷新语义 | [阅读对应专题](/zh/reference/cosec/interceptors-and-attribution.md) |
| <span id="并发刷新、重试与错误"></span>并发刷新、重试与错误 | [阅读对应专题](/zh/reference/cosec/tokens-and-refresh.md) |
| <span id="清理、安全与排障"></span>清理、安全与排障 | [阅读对应专题](/zh/reference/cosec/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/cosec/index.md) |
