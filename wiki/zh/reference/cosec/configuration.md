---
title: 'CoSec 配置'
description: 'CoSec 配置 — Fetcher 6.0.0'
---

# CoSec 配置

`CoSecConfigurer` 为 Fetcher 接入 CoSec 元数据、资源归属及可选鉴权。它不提供登录端点或服务端 token 验证。

每个客户端应只应用一次配置。拦截器注册会拒绝重复名称：再次调用 `applyTo` 不会用新 configurer 的依赖替换原拦截器。需要改变认证所有权时，应新建独立配置的 Fetcher，或在停止原请求后显式移除旧的具名拦截器。

## CoSecConfig 与构造

| 字段                               | 默认值                | 契约                                                                                                                                                                                                                                             |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| appId?:string                      | 已弃用，被忽略        | 不起作用：CoSec 8.0 不从请求读取应用，应用是令牌的 `aud`；保留只为让现有配置仍能编译，下一个主版本移除                                                                                                                                           |
| tokenStorage:TokenStorage          | new TokenStorage()    | 通过 configurer.tokenStorage 暴露                                                                                                                                                                                                                |
| deviceIdStorage:DeviceIdStorage    | new DeviceIdStorage() | 通过 configurer.deviceIdStorage 暴露                                                                                                                                                                                                             |
| tokenRefresher:TokenRefresher      | 缺省                  | 仅存在时创建 JwtTokenManager 并安装 Authorization 请求/响应拦截器                                                                                                                                                                                |
| spaceIdProvider:SpaceIdProvider    | NoneSpaceIdProvider   | 解析可选 CoSec-Space-Id                                                                                                                                                                                                                          |
| isTrusted:RequestTrust             | 缺省（信任所有请求）  | 决定哪些绝对请求 URL 携带 Authorization token 与 CoSec 请求头（含设备 ID）；`sameOriginTrust` 只放行 `baseURL` 所在源与页面自身的源。位于 `baseURL` 主机上的相对 URL 受信任；经 URL 解析去往其他主机的相对 URL（如 `\host/path`）按绝对 URL 判断 |
| isRefreshRejected(error)           | 刷新路由返回 `401`    | 刷新失败是否结束会话；见[刷新失败](./tokens-and-refresh#刷新管理器与传输)                                                                                                                                                                        |
| rotationLeeway:number              | 30000                 | 毫秒；**至多等于服务端的 `cosec.jwt.session.rotation-leeway`**，客户端无法读取它（[轮换下的刷新](./tokens-and-refresh#refresh-under-rotation)）                                                                                                  |
| refreshRetryDelays:number[]        | [500, 2000]           | 结果未知的刷新在窗口内重试前的停顿；`[]` 表示不重试                                                                                                                                                                                              |
| onUnauthorized(exchange, problem?) | 缺省                  | 错误管线中的可选 void/Promise&lt;void&gt; 回调；有 CoSec problem 时，`problem` 是响应的、或被拒绝的刷新的 problem                                                                                                                                |     |
| onForbidden(exchange, problem?)    | 缺省                  | 错误管线中针对 403 的可选 Promise&lt;void&gt; 回调（没有 `onScopeRejected` 时，`scope-rejected` 也交给它）                                                                                                                                       |
| onScopeRejected(exchange, problem) | 缺省                  | 针对 `403 scope-rejected` 的可选 Promise&lt;void&gt; 回调；由应用决定，客户端既不清除空间，也不退回默认空间                                                                                                                                      |

`new CoSecConfigurer(config)` 立即初始化存储。`applyTo(fetcher): void` 始终安装 CoSecRequestInterceptor 和 ResourceAttributionRequestInterceptor；仅有 tokenManager 时安装鉴权；仅配置回调时安装错误处理。没有 tokenRefresher 时，仅将 token 放入 tokenStorage **不会**启用 Authorization 注入。`isTrusted` 同时传给 CoSecRequestInterceptor 与 AuthorizationRequestInterceptor：不受信任的请求不带 CoSec 请求头、不带 Authorization，也不触发刷新。`tokenManager`、`spaceIdProvider` 以 readonly 暴露（声明为可选）；config 引用 readonly，不代表深度不可变。

::: warning 其他源上的绝对 URL
不设 `isTrusted` 时，发往任意源绝对 URL 的请求（分页链接、下载地址、回调）都会收到访问 token 与设备 ID。除非客户端请求的每个绝对 URL 都属于你，否则请传 `isTrusted: sameOriginTrust`（或自己的 `RequestTrust`）。
:::

`DeviceIdStorageCapable` 与 `JwtTokenManagerCapable` 要求各自对应属性；`AppIdCapable` 已弃用，其 `appId` 可选；`CoSecOptions` 合并三者，而 CoSecConfig 允许省略存储/refresher。它们是依赖形状，不是额外配置函数。

## 完整服务配置

服务需要实现 POST `/auth/refresh`，接收 `{accessToken, refreshToken}` 并返回同样形状；拒绝这对 token 时回答 `401`，无法判断时回答 `503`；它必须允许匿名调用方访问，因为它收到的访问令牌已经过期（见[应用必须允许什么](../../guides/integrations/cosec#application-must-allow)）。示例使用同一已配置 Fetcher；CoSecTokenRefresher 会标记自己的请求，防止递归刷新。没有嵌入真实凭据。

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

## 所有权与清理

在应用/会话生命周期内复用已配置客户端和存储。CoSecConfigurer 没有 dispose/unapply 方法。拆除自己拥有的配置时，先停止请求，用 `eject(name)` 从相应 request/response/error manager 移除已安装拦截器，再对自己拥有的 KeyStorage 实例调用 `destroy()`。`destroy()` 解绑存储内部处理器，并关闭存储为自己创建的广播总线（`TokenStorage` 与 `DeviceIdStorage` 的默认总线）；它不退出登录，也不销毁通过 `eventBus` 传入的总线。不再有存储使用时，另行销毁这类共享总线。单个消费者不应销毁共享存储。参见[存储生命周期](../storage/key-storage)及[拦截器行为](./interceptors-and-attribution)。

<span id="cosecconfig"></span>

**`CoSecConfig`** — [packages/cosec/src/cosecConfigurer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L88)

<span id="cosecconfigurer"></span>

**`CoSecConfigurer`** — [packages/cosec/src/cosecConfigurer.ts:396](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L396)

<span id="appidcapable"></span>

**`AppIdCapable`** — [packages/cosec/src/types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L33)

<span id="deviceidstoragecapable"></span>

**`DeviceIdStorageCapable`** — [packages/cosec/src/types.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L44)

<span id="jwttokenmanagercapable"></span>

**`JwtTokenManagerCapable`** — [packages/cosec/src/types.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L48)

<span id="cosecoptions"></span>

**`CoSecOptions`** — [packages/cosec/src/types.ts:55](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L55)
