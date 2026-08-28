---
title: 增加 CoSec 认证
description: 为 Fetcher 增加 CoSec 请求头、Token 存储、自动刷新和鉴权错误处理。
---

# 增加 CoSec 认证

`CoSecConfigurer` 是 CoSec 拦截器的组合根。最小配置会增加应用、设备和请求 ID；提供 TokenRefresher 后还会启用 Bearer 认证与刷新。

## 配置可信 API 客户端

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
  onUnauthorized: () => {
    window.location.assign('/login');
  },
  onForbidden: async () => {
    console.error('Access denied');
  },
});

cosec.applyTo(api);
```

使用未配置 CoSec 的独立 Fetcher 刷新 Token。`CoSecTokenRefresher` 会标记刷新调用，防止认证拦截器递归刷新。

## 登录与退出

保存认证端点返回的 Token Pair：

```ts
cosec.tokenStorage.signIn({
  accessToken: loginResponse.accessToken,
  refreshToken: loginResponse.refreshToken,
});

console.log(cosec.tokenStorage.authenticated);
console.log(cosec.tokenStorage.currentUser);
```

退出会删除 Token Pair，并通过默认存储事件总线向其他 Context 广播变更：

```ts
cosec.tokenStorage.signOut();
```

不要记录、写入文档或提交真实 Token。

## 每个请求会获得什么

配置后的请求拦截器会增加：

- `CoSec-App-Id`
- `CoSec-Device-Id`
- `CoSec-Request-Id`
- Provider 能解析时的 `CoSec-Space-Id`
- 存在已认证 Token 时的 `Authorization: Bearer …`

显式请求 Authorization 不会被覆盖。

## 刷新与错误

发送请求前，只有 Access Token 进入过期/提前刷新区间且 Refresh Token 仍有效时才会刷新。并发刷新共享同一个进行中 Promise。刷新失败会删除已存 Token 并抛出 `RefreshTokenError`。

收到 `401` 后，认证响应/错误拦截器按配置运行；`403` 会在提供时调用 `onForbidden`。界面跳转保留在这些回调中，Token 协议保留在 CoSec 组件内。

## 空间与资源归属

只有服务端契约要求空间请求头的资源才增加 `SpaceIdProvider`。资源归属拦截器还可以从请求契约解析 Tenant/Owner；不要全局注入猜测的 Tenant 值。

## 安全测试

使用内存存储、固定的假 JWT 和 Mock Fetch 边界。断言请求头名称、刷新次数、存储变更以及 401/403 回调，不要联系真实身份服务。
