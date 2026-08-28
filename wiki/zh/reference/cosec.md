---
title: CoSec 参考
description: 配置 CoSec 请求归属、JWT 存储与刷新、重试上限、清理和安全边界。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-cosec`

CoSec 将请求归属和可选 JWT 刷新组合到 Fetcher Interceptor Chain。它只是客户端便利层：
JWT 解码不是签名验证，授权权威仍然是服务端。

## 安装与选择配置

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

| 目标 | 入口 | 结果 |
| --- | --- | --- |
| 仅应用/设备/请求归属 | `new CoSecConfigurer({ appId })` | CoSec 与 Resource Attribution Request Interceptor |
| Bearer 注入与自动刷新 | 增加 `tokenRefresher` | 增加 Authorization Request 和 401 Response Interceptor |
| 应用级 401 / 403 响应 | 增加 `onUnauthorized` / `onForbidden` | 增加对应 Error Interceptor |
| 不同资源参数名或顺序 | 单独使用公开 Interceptor | 应用拥有完整 Pipeline |

`appId` 必填。`CoSecConfigurer` 总会创建 `TokenStorage`、`DeviceIdStorage` 和无空间
Provider；仅当存在 `tokenRefresher` 时才创建 `JwtTokenManager`
([`cosecConfigurer.ts:445`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L445))。

## 配置与最小安全示例

| `CoSecConfig` 字段 | 默认值 | 作用 |
| --- | --- | --- |
| `appId` | 必填 | 每个受配置请求的 `CoSec-App-Id` |
| `tokenStorage` | `new TokenStorage()` | Token State 和 Token Change Event Bus |
| `deviceIdStorage` | `new DeviceIdStorage()` | 稳定的 `CoSec-Device-Id` |
| `tokenRefresher` | 缺省 | 启用 Bearer 注入与刷新/重试 |
| `spaceIdProvider` | `NoneSpaceIdProvider` | 解析可选 `CoSec-Space-Id` |
| `onUnauthorized` | 缺省 | 最终 401 或 `RefreshTokenError` 时执行 |
| `onForbidden` | 缺省 | 403 时执行 |

默认浏览器存储为 `localStorage`；`TokenStorage` 会把 access/refresh token 对作为 JSON
序列化。这是明文、JavaScript 可读的持久化，对存在 XSS 风险的浏览器不是安全的生产默认值。
此包没有内置的安全持久 Token Store。优先采用 HttpOnly Cookie 或服务端 Session；不能采用时，
应在安全评审后传入有意选择的 Storage 实现。下面的内存示例仅用于测试和短生命周期 Demo
([`env.ts:25`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L25)，
[`jwtToken.ts:255`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L255))。

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  TokenStorage,
} from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.test' });
const refreshApi = new Fetcher({ baseURL: 'https://api.example.test' });
const tokenStorage = new TokenStorage({ storage: new InMemoryStorage() });

const cosec = new CoSecConfigurer({
  appId: 'example-console',
  tokenStorage,
  tokenRefresher: new CoSecTokenRefresher({
    fetcher: refreshApi,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => tokenStorage.signOut(),
  onForbidden: async () => {
    // 更新应用 UI，且不暴露 Token 材料。
  },
});

cosec.applyTo(api);
```

刷新使用的 Fetcher 不应配置这一个 CoSec Configurer。内置 Refresher 会使用
`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` 标记请求，从而防止 Request Interceptor 再次尝试刷新
([`tokenRefresher.ts:192`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L192))。

## Token 生命周期与状态

收到可信 Sign-in Response 后，用 Token Pair 调用 `tokenStorage.signIn()`。`authenticated`
表示 access JWT 可解析且未过期；`currentUser` 返回已解码的 CoSec Payload 或 `null`。
`signOut()` 移除已配置的 Token Key；`destroy()` 只解绑 Storage Object 自己的 Event Handler，
因此它**不会** Sign-out 或擦除持久 Token
([`tokenStorage.ts:95`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L95)，
[`keyStorage.ts:208`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L208))。

| API | 返回值 | 契约 |
| --- | --- | --- |
| `signIn(token)` | `void` | 包装并存储 `CompositeToken` |
| `signOut()` | `void` | 移除配置的 Token Key |
| `authenticated` | `boolean` | 仅当 access JWT 未过期时为 `true` |
| `currentUser` | `CoSecJwtPayload \| null` | 仅解码 Payload；绝不是信任凭据 |
| `JwtTokenManager.currentToken` | `JwtCompositeToken \| null` | 当前包装后的 Token Pair |
| `JwtTokenManager.refresh()` | `Promise<void>` | 替换已存储 Pair，或失败后移除它 |

`earlyPeriod` 默认 `0` 秒。它会让 access 和 refresh JWT 都提前视为过期；畸形 JWT 会被视为
过期 ([`tokenStorage.ts:60`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L60)，
[`jwtToken.ts:96`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L96))。

## Interceptor Pipeline 与刷新语义

`applyTo()` 注册如下 Interceptor。Request Interceptor 依公开的数值 `order` 排序；下图记录
Configurer 的预期组合，而不是客户端做出的授权决定。

```text
CoSecRequest
  → AuthorizationRequest（仅 tokenRefresher 存在）
  → ResourceAttribution
  → 网络响应
  → AuthorizationResponse（仅 tokenRefresher 存在）
  → Unauthorized / Forbidden Error Callback（仅被配置时）
```

| 阶段 | 公共类型 | 行为 |
| --- | --- | --- |
| 请求身份 | `CoSecRequestInterceptor` | 设置应用、设备、唯一请求和可选空间 Header |
| 资源归属 | `ResourceAttributionRequestInterceptor` | 从解码 Claim 填充缺失的 URL Template `tenantId` 与 `ownerId` |
| Bearer 请求 | `AuthorizationRequestInterceptor` | 在该请求阶段保留显式 `Authorization` Header；否则按需刷新并添加 `Bearer` |
| 401 响应 | `AuthorizationResponseInterceptor` | 刷新、移除过期 Bearer，然后至多重跑一次 Exchange |
| 最终错误 | `UnauthorizedErrorInterceptor`、`ForbiddenErrorInterceptor` | 调用应用 Callback；不修复权限 |

Request 顺序按数值 `order` 升序：`CoSecRequestInterceptor`，然后
`AuthorizationRequestInterceptor`，最后 `ResourceAttributionRequestInterceptor`。最后一个
Interceptor 被有意放在 URL Resolve 紧前方
([`interceptor.ts:173`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptor.ts#L173)，
[`authorizationRequestInterceptor.ts:28`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L28)，
[`resourceAttributionRequestInterceptor.ts:50`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L50))。

Resource Attribution 由 URL Template 选择：只有 Template 含默认 `tenantId` 和 `ownerId` Key，且
调用方尚未传值时，它才填充。它读取已解码 Access Payload 的 `tenantId` 与 `sub`
([`resourceAttributionRequestInterceptor.ts:84`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/resourceAttributionRequestInterceptor.ts#L84))。
仅当 Template 使用不同参数名时，才在构造函数中传入自定义 Options。

发送请求前，`AuthorizationRequestInterceptor` 会保留显式 `Authorization` Header。存在受管 Token
时，它只在 Access Token 需要刷新、Refresh JWT 仍有效且请求不带忽略刷新 Attribute 时刷新
([`authorizationRequestInterceptor.ts:63`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationRequestInterceptor.ts#L63))。
该保留只适用于初始 Request Interceptor Pass：401 时，`AuthorizationResponseInterceptor` 不会检查
Header 来自哪里。它可能刷新、删除该 Header，并使用受管 Token 重试。需要有意使用不同凭据时，
应使用未安装 CoSec Authorization Response Interceptor 的独立 Fetcher
([`authorizationResponseInterceptor.ts:102`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L102))。

## 并发刷新、重试与错误

`JwtTokenManager` 保存一个进行中的 Refresh Promise。并发调用会 Await 同一个 Promise；成功会写入
新 Pair。刷新失败会移除存储状态，并抛出包装旧 Token 与原始 Cause 的 `RefreshTokenError`
([`jwtTokenManager.ts:59`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L59))。

401 Response 与主动过期刷新不同。Response Interceptor 每个 Exchange 至多重试一次
（`AUTHORIZATION_RESPONSE_MAX_RETRY === 1`）。它只在 Refresh Token 可用时刷新，重试前会移除
过期 Bearer Header；重试自身失败会原样传播，不会清除仍可能有效的新 Token
([`authorizationResponseInterceptor.ts:72`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L72))。

| 失败 | 结果 |
| --- | --- |
| 直接调用 `refresh()` 但没有当前 Token | 以 `Error('No token found')` Reject |
| Refresh Endpoint / 解析失败 | 移除 Token Storage；传播 `RefreshTokenError` |
| Refresh JWT 已过期 | 不对 401 刷新/重试；原 Response 继续 |
| 重试仍返回 401 | 不做第二次刷新/重试；可能进入最终 Error Pipeline |
| 401 且配置了 `onUnauthorized` | 401 或 `RefreshTokenError` 时运行 Callback |
| 403 且配置了 `onForbidden` | 仅在 403 时运行 Callback |

## 清理、安全与排障

`signOut()` 不会取消进行中的 `JwtTokenManager.refresh()`。之后成功的 Refresh 会无条件写入新 Pair，
因此可能在 Sign-out 后恢复 Token
([`jwtTokenManager.ts:68`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L68))。
最终 Logout 应停止接纳新的受保护请求，协调取消或等待可能触发 Refresh 的进行中请求，再在其结束后
调用 `signOut()`；若切换期间可能已完成 Refresh，则再次调用它作为最终清理。Storage Object 不再使用时
再调用 `destroy()`。不要记录 `CompositeToken`、原始 JWT String、Authorization Header，或带敏感
Claim 的解码 Payload。`parseJwtPayload()` 是 Decode Helper，不是签名验证；
无效解析返回 `null`，且当前实现会将通用解析错误写到 `console.error`，因此不能把它当作脱敏边界
([`jwts.ts:91`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L91))。

| 现象 | 检查项 |
| --- | --- |
| 没有 `Authorization` Header | 提供 `tokenRefresher`、Sign-in 有效 access JWT，并检查请求是否自行设置了 Header。 |
| 反复 401 | 客户端仅重试一次；检查服务端授权和 Refresh Endpoint 行为，且不得记录 Token Data。 |
| Token 意外消失 | Refresh 失败会有意移除 Storage；通过 `onUnauthorized` 处理 `RefreshTokenError`。 |
| Tenant/Owner Path 错误 | 确保 URL Template 中有 `{tenantId}` / `{ownerId}`，或显式传值覆盖归属。 |
| Component 卸载后 Token 仍在 | `destroy()` 仅清理；调用 `signOut()` 才会移除存储项。 |
| Logout 后 Token 再次出现 | 协调进行中的 Refresh/请求，然后执行最终 `signOut()`；单独 Sign-out 无法取消 Refresh。 |
| 浏览器安全顾虑 | 默认 `localStorage` 是明文；迁移到 HttpOnly/服务端设计，或提供经过评审的 Storage Adapter。 |

## 源码参考

- [packages/cosec/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts#L14)
- [packages/cosec/src/cosecConfigurer.ts:445](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L445)
- [packages/cosec/src/tokenStorage.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L60)
- [packages/cosec/src/jwtTokenManager.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L59)
- [packages/cosec/src/authorizationResponseInterceptor.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L29)
