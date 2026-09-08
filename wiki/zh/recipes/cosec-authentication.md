---
title: 接入 CoSec 身份认证
description: 创建包含刷新、令牌所有权及清理逻辑的浏览器认证会话。
---

# 接入 CoSec 身份认证

将浏览器应用连接到现有 CoSec 服务，得到一个处理登录、受保护请求和退出登录的会话对象。

## 1. 确认认证契约

安装 `@ahoo-wang/fetcher` 和 `@ahoo-wang/fetcher-cosec`。应用须已有登录流程，返回 JWT 字符串 `accessToken` 和 `refreshToken`。本例的 `POST /auth/refresh` 接收该令牌对的 JSON 并返回新令牌对，`GET /profile` 返回 `{ id, name }`。这些路由和 app ID 必须与后端一致。仅对该可信来源使用此客户端。

## 2. 为应用所有者创建一个会话

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSession(baseURL: string) {
  const api = new Fetcher({ baseURL });
  const refreshApi = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    appId: 'developer-console',
    tokenRefresher: new CoSecTokenRefresher({
      fetcher: refreshApi,
      endpoint: '/auth/refresh',
    }),
    onUnauthorized: () => {
      console.error('Sign in again');
    },
    onForbidden: async () => {
      console.error('Access denied');
    },
  });
  cosec.applyTo(api);

  return {
    signIn(tokens: CompositeToken) {
      cosec.tokenStorage.signIn(tokens);
    },
    signOut() {
      cosec.tokenStorage.signOut();
    },
    async loadProfile() {
      return api.get<{ id: string; name: string }>(
        '/profile',
        {},
        { resultExtractor: ResultExtractors.Json },
      );
    },
    dispose() {
      cosec.tokenStorage.destroy();
      cosec.tokenStorage.eventBus.destroy();
      cosec.deviceIdStorage.destroy();
      cosec.deviceIdStorage.eventBus.destroy();
    },
  };
}
```

独立刷新客户端让刷新请求不经过受保护请求的管线。`CoSecTokenRefresher` 还会设置跳过递归刷新的标记。提供 tokenRefresher 才会启用 bearer 认证；仅传 appId 只安装基础请求头和资源归属逻辑。

## 3. 连接登录与退出流程

应用启动时创建 `const session = createSession(yourApiOrigin)`。登录成功后调用 `session.signIn(loginResponse)`，再在 UI 错误边界内等待 `session.loadProfile()`。退出时调用 `session.signOut()` 并清除敏感 UI 状态。不要将真实令牌写入源码或日志。

令牌解析不是签名验证，授权责任仍在后端。请求中显式提供的 Authorization 不会被覆盖。添加空间或租户行为前先阅读[请求头与资源归属规则](../reference/cosec/interceptors-and-attribution)。

## 4. 验证刷新与失败行为

在测试中使用内存令牌/设备存储和模拟 fetch，覆盖有效令牌、访问令牌过期但刷新令牌有效、并发请求、刷新失败及 401/403 响应。刷新并发在单个 token manager 内共享，不是跨标签页的分布式锁。刷新失败可能清除当前会话；回调不会将失败请求变成成功结果。除了显示登录或错误界面，也要捕获请求拒绝。

## 5. 清理所有者

当前 `TokenStorage` 默认使用按存储 key 命名的广播总线；其他上下文需要匹配通道和支持的 messenger。这与默认只使用本地总线的普通 `KeyStorage` 不同。广播是变更通知，不是跨标签页的事务性刷新协调。

应用关闭时停止尚未完成的应用任务，并调用 `session.dispose()`。它释放本例拥有的存储处理器和总线，不删除令牌；退出登录需另外调用 `signOut()`。 存储通知是异步的：退出登录后通知仍在投递时，不要立即销毁会话。投递中关闭总线可能中断广播并记录错误。不要销毁其他所有者仍在共享的总线。配置器没有 dispose 方法；本例随会话一起停止使用私有 Fetcher。

查阅[配置](../reference/cosec/configuration)和[令牌刷新与存储](../reference/cosec/tokens-and-refresh)。

[tokenStorage.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L94) 创建默认广播总线。
