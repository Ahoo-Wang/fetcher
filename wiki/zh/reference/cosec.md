---
title: CoSec 参考
description: 配置 CoSec 归属请求头、JWT 持久化、刷新以及 401 或 403 处理。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-cosec`

CoSec 包把请求归属信息和可选 JWT 认证组合进 Fetcher 拦截器链。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

## 配置客户端

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer, CoSecTokenRefresher } from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.com' });
const refreshFetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const cosec = new CoSecConfigurer({
  appId: 'developer-console',
  tokenRefresher: new CoSecTokenRefresher({
    fetcher: refreshFetcher,
    endpoint: '/auth/refresh',
  }),
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => showAccessDenied(),
});

cosec.applyTo(api);
```

刷新请求使用独立、未配置 CoSec 的 Fetcher。内置 refresher 会标记请求，防止递归刷新令牌。

## `CoSecConfig`

| 选项              | 默认值                  | 效果                       |
| ----------------- | ----------------------- | -------------------------- |
| `appId`           | 必填                    | 添加应用标识               |
| `tokenStorage`    | `new TokenStorage()`    | 持久化并广播 JWT 变化      |
| `deviceIdStorage` | `new DeviceIdStorage()` | 持久化设备标识             |
| `tokenRefresher`  | 无                      | 启用 Bearer 认证与自动刷新 |
| `spaceIdProvider` | 无空间                  | 解析可选空间标识           |
| `onUnauthorized`  | 无                      | 处理最终 `401` 响应        |
| `onForbidden`     | 无                      | 处理 `403` 响应            |

没有 `tokenRefresher` 时，Configurer 仍会添加应用、设备、请求和可选资源归属信息，但不
添加 Bearer 认证拦截器。

## 令牌

`TokenStorage` 存储 JWT 组合令牌，并暴露 `signIn()`、`signOut()`、`authenticated`
和 `currentUser`。`JwtTokenManager` 会合并并发刷新。刷新失败会删除存储令牌并抛出
`RefreshTokenError`。

请求拦截器会保留显式 `Authorization` 请求头。切勿记录、嵌入或提交真实 access token
和 refresh token。

## 高级组合

公开拦截器包括 CoSec 请求头、授权请求与响应处理、资源归属，以及 401/403 错误处理器。
优先使用 `CoSecConfigurer`；只有应用确实拥有不同管线时，才单独实例化拦截器。

## 拦截器流程

```text
请求归属
  → 可选 Authorization Header
  → HTTP Request
  → 可选 Token 刷新与重试
  → 未认证 / 禁止访问处理器
```

| 层          | 主要 API                                                    | 职责                             |
| ----------- | ----------------------------------------------------------- | -------------------------------- |
| 配置        | `CoSecConfigurer`                                           | 注册一致的默认拦截器集合         |
| Token State | `TokenStorage`、`JwtCompositeTokenSerializer`               | 持久化并观察登录状态             |
| Refresh     | `JwtTokenManager`、`TokenRefresher`、`CoSecTokenRefresher`  | 合并并发刷新并取得新 Token       |
| Attribution | `DeviceIdStorage`、`SpaceIdProvider`、资源拦截器            | 添加应用、设备、空间和资源上下文 |
| 最终错误    | `UnauthorizedErrorInterceptor`、`ForbiddenErrorInterceptor` | 把最终 401/403 转成应用行为      |

使用 `CoSecHeaders` 常量，不要重复协议 Header 字符串。显式 `Authorization` Header
优先，因此调用方可以有意为单次请求使用不同凭据。

## Token 生命周期与安全

`JwtToken` 解码 Token 时间与 Payload 字段；`JwtCompositeToken` 把 Access 与 Refresh
材料组合在一起。解码不等于验证签名，只有服务端能够建立信任。

登出必须清除 Token Storage，以及由认证身份派生的应用状态。不要把 CoSec 附加到
`CoSecTokenRefresher` 使用的 Fetcher，否则刷新请求可能递归触发刷新。

## 源码与 Agent 参考

- 公共导出：[`packages/cosec/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/index.ts)
- Agent 精确 API：[`skills/fetcher-cosec-auth/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-cosec-auth/references/api.md)
- Skill：[`$fetcher-cosec-auth`](../skills/react-and-integrations.md#fetcher-cosec-auth)

参阅[添加 CoSec 认证](../recipes/cosec-authentication.md)，了解登录、退出、空间归属和安全测试。
