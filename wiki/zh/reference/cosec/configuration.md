---
title: 'CoSec 配置'
description: 'CoSec 配置 — Fetcher 5.0.0'
---

# CoSec 配置

`CoSecConfigurer` 为 Fetcher 接入 CoSec 元数据、资源归属及可选鉴权。它不提供登录端点或服务端 token 验证。

每个客户端应只应用一次配置。拦截器注册会拒绝重复名称：再次调用 `applyTo` 不会用新 configurer 的依赖替换原拦截器。需要改变认证所有权时，应新建独立配置的 Fetcher，或在停止原请求后显式移除旧的具名拦截器。

## CoSecConfig 与构造

| 字段                            | 默认值                | 契约                                                              |
| ------------------------------- | --------------------- | ----------------------------------------------------------------- |
| appId:string                    | 必填                  | 在请求头发送的应用标识                                            |
| tokenStorage:TokenStorage       | new TokenStorage()    | 通过 configurer.tokenStorage 暴露                                 |
| deviceIdStorage:DeviceIdStorage | new DeviceIdStorage() | 通过 configurer.deviceIdStorage 暴露                              |
| tokenRefresher:TokenRefresher   | 缺省                  | 仅存在时创建 JwtTokenManager 并安装 Authorization 请求/响应拦截器 |
| spaceIdProvider:SpaceIdProvider | NoneSpaceIdProvider   | 解析可选 CoSec-Space-Id                                           |
| onUnauthorized(exchange)        | 缺省                  | 错误管线中的可选 void/Promise&lt;void&gt; 回调                    |
| onForbidden(exchange)           | 缺省                  | 错误管线中的可选 Promise&lt;void&gt; 回调                         |

`new CoSecConfigurer(config)` 立即初始化存储。`applyTo(fetcher): void` 始终安装 CoSecRequestInterceptor 和 ResourceAttributionRequestInterceptor；仅有 tokenManager 时安装鉴权；仅配置回调时安装错误处理。没有 tokenRefresher 时，仅将 token 放入 tokenStorage **不会**启用 Authorization 注入。`tokenManager`、`spaceIdProvider` 以 readonly 暴露（声明为可选）；config 引用 readonly，不代表深度不可变。

`AppIdCapable`、`DeviceIdStorageCapable`、`JwtTokenManagerCapable` 要求各自对应属性；`CoSecOptions` 合并三者，而 CoSecConfig 允许省略存储/refresher。它们是依赖形状，不是额外配置函数。

## 完整服务配置

服务需要实现 POST `/auth/refresh`，接收 `{accessToken, refreshToken}` 并返回同样形状。示例使用同一已配置 Fetcher；CoSecTokenRefresher 会标记自己的请求，防止递归刷新。没有嵌入真实凭据。

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSecureClient(baseURL: string) {
  const fetcher = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    appId: 'example-app',
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

在应用/会话生命周期内复用已配置客户端和存储。CoSecConfigurer 没有 dispose/unapply 方法。拆除自己拥有的配置时，先停止请求，用 `eject(name)` 从相应 request/response/error manager 移除已安装拦截器，再对自己拥有的 KeyStorage 实例调用 `destroy()`。`destroy()` 只解绑存储内部处理器，不退出登录，也不销毁外部共享事件总线。不再有存储使用时，另行销毁自己拥有的广播总线。单个消费者不应销毁共享存储。参见[存储生命周期](../storage/key-storage)及[拦截器行为](./interceptors-and-attribution)。

<span id="cosecconfig"></span>

**`CoSecConfig`** — [packages/cosec/src/cosecConfigurer.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L86)

<span id="cosecconfigurer"></span>

**`CoSecConfigurer`** — [packages/cosec/src/cosecConfigurer.ts:373](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/cosecConfigurer.ts#L373)

<span id="appidcapable"></span>

**`AppIdCapable`** — [packages/cosec/src/types.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L33)

<span id="deviceidstoragecapable"></span>

**`DeviceIdStorageCapable`** — [packages/cosec/src/types.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L40)

<span id="jwttokenmanagercapable"></span>

**`JwtTokenManagerCapable`** — [packages/cosec/src/types.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L44)

<span id="cosecoptions"></span>

**`CoSecOptions`** — [packages/cosec/src/types.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/types.ts#L51)
