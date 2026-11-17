---
title: 接入 CoSec 身份认证
description: 创建包含刷新、令牌所有权及清理逻辑的浏览器认证会话。
---

# 接入 CoSec 身份认证

将浏览器应用连接到现有 CoSec 服务，得到一个处理登录、受保护请求和退出登录的会话对象。

**对接的 CoSec 版本。** `@ahoo-wang/fetcher-cosec` 6.x 对接 CoSec 7.x。下一个主版本**只对接 CoSec 8.0**：它不再发送 `CoSec-App-Id`（8.0 不读取它，应用是令牌的 `aud`），并根据 8.0 的 `application/problem+json` 回答采取行动。对接 CoSec 7 服务端请使用 6.x。

安装时还需要解析该包声明的全部 peer 依赖；完整清单见[包接入前提](../../reference/cosec/index.md)。以下服务路由和身份由应用提供，不由安装过程创建。

## 1. 确认认证契约

安装 `@ahoo-wang/fetcher` 和 `@ahoo-wang/fetcher-cosec`。应用须已有登录流程，返回 JWT 字符串 `accessToken` 和 `refreshToken`。本例的 `POST /auth/refresh` 接收该令牌对的 JSON 并返回新令牌对，`GET /profile` 返回 `{ id, name }`。这些路由必须与后端一致。仅对该可信来源使用此客户端。下面的 `isTrusted: sameOriginTrust` 让令牌和设备 ID 只发往 `baseURL` 所在源与页面自身的源；不设它时，发往其他任意源绝对 URL 的请求（分页链接、下载地址）会收到访问令牌。

### CoSec 8.0 应用必须允许什么 {#application-must-allow}

CoSec 不提供登录、刷新或退出端点：它们由应用编写，客户端依赖它们具备以下性质。

- **刷新路由允许匿名调用方访问。** 客户端发送的是已过期的访问令牌，而 CoSec 把过期令牌当作匿名。若没有任何语句让 `Anyone` 访问刷新路由，刷新本身就是 `401 token-expired`，用户会在第一个访问令牌过期时（默认十分钟）被退出登录。
- **应用拒绝刷新时回答 `401`；无法判断时回答 `503`。** 只有刷新路由返回 `401` 才会结束会话（`RefreshTokenError`、移除 token、`onUnauthorized`）。`429`、`400`、`403`、`404`、`5xx`、网络错误或超时都会保留会话（`RefreshUnavailableError`）。若你的路由用其他状态拒绝，请用 `isRefreshRejected` 说明。
- **`rotationLeeway`** 至多等于服务端的 `cosec.jwt.session.rotation-leeway`（默认 30 秒）。客户端无法读取它；见[轮换下的刷新](../../reference/cosec/tokens-and-refresh#refresh-under-rotation)。
- **应用是令牌的 `aud`。** 只服务一个应用的主机（`cosec.authorization.scope.app-id`）会对其他应用、或没有应用的令牌回答 `403 scope-rejected`；客户端不选择应用。
- **退出登录是一次服务端调用，然后才是 `signOut()`。** 仅在本地忘记这对 token，它在会话结束前仍可刷新。切换租户或应用会得到一对新 token：`signIn` 它。
- **CORS 要让脚本读得到拒绝。** 位于其他源的浏览器客户端需要在 CoSec 之前放一个 CORS 过滤器，允许 `Authorization`、`Content-Type`、`CoSec-Device-Id`、`CoSec-Space-Id` 与 `CoSec-Request-Id`，并暴露 `CoSec-Request-Id`、`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset` 与 `Retry-After`。否则拒绝到达脚本时是一个网络错误，与离线无法区分。

## 2. 为应用所有者创建一个会话

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  CoSecConfigurer,
  CoSecTokenRefresher,
  sameOriginTrust,
  type CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

export function createSession(baseURL: string) {
  const api = new Fetcher({ baseURL });
  const refreshApi = new Fetcher({ baseURL });
  const cosec = new CoSecConfigurer({
    isTrusted: sameOriginTrust,
    tokenRefresher: new CoSecTokenRefresher({
      fetcher: refreshApi,
      endpoint: '/auth/refresh',
    }),
    onUnauthorized: (_exchange, problem) => {
      // problem?.slug：'unauthorized'、'token-revoked'、'token-invalid'，
      // 或刷新被拒绝时的 'token-expired'
      console.error('Sign in again', problem?.requestId);
    },
    onForbidden: async () => {
      console.error('Access denied');
    },
    onScopeRejected: async (exchange, problem) => {
      // 请求的空间、或令牌的应用，不是该主体可以使用的。
      // 由应用决定怎么做：客户端不会清除已存的空间，也不会退回默认空间。
      console.error('Scope rejected', problem.requestId);
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
      cosec.deviceIdStorage.destroy();
    },
  };
}
```

独立刷新客户端让刷新请求不经过受保护请求的管线。`CoSecTokenRefresher` 还会设置跳过递归刷新的标记。提供 tokenRefresher 才会启用 bearer 认证；没有它时配置器只安装基础请求头和资源归属逻辑。已弃用的 `appId` 选项会被接受并忽略。

## 3. 连接登录与退出流程

应用启动时创建 `const session = createSession(yourApiOrigin)`。登录成功后调用 `session.signIn(loginResponse)`，再在 UI 错误边界内等待 `session.loadProfile()`。退出时调用 `session.signOut()` 并清除敏感 UI 状态。不要将真实令牌写入源码或日志。

令牌解析不是签名验证，授权责任仍在后端。请求中显式提供的 Authorization 不会被覆盖。添加空间或租户行为前先阅读[请求头与资源归属规则](../../reference/cosec/interceptors-and-attribution)。

## 4. 验证刷新与失败行为

CoSec 8.0 的拒绝是 `application/problem+json`，含 `type`（`https://cosec.ahoo.me/problems/<slug>`）、`title`、`status`、`code`、`requestId`，以及追踪捕获到时的 `traceId`。客户端从响应正文的副本中读取它（`CoSecProblem`，即回调的第二个参数，或对被拒绝的请求使用 `getCoSecProblem(error)`），并依据类型而不是仅凭状态采取行动：

| Problem 类型（`code`）                            | 客户端的做法                                                                                                                          | 回调                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `invalid-request`（`400`）                        | 什么都不做：这是请求本身的缺陷（`CoSec-*` 请求头以不同取值发送了两次、路径有歧义）。会话保留。                                        | 无；被拒绝的请求带有 problem                             |
| `unauthorized`（`401`）                           | 不刷新：服务端没有看到凭据。已存的那对 token 保留。                                                                                   | `onUnauthorized(exchange, problem)`                      |
| `token-expired`（`401`）                          | 刷新一次，并重发请求一次                                                                                                              | 仅当刷新被拒绝时 `onUnauthorized`                        |
| `token-revoked`、`token-invalid`（`401`）         | 不刷新：会话已结束，或凭据不被接受。若存储中仍是发出请求时的那对 token 就将其移除（另一个标签页可能已重新登录）。                     | `onUnauthorized(exchange, problem)`，一次                |
| `forbidden`（`403`）                              | 什么都不做：用户无权                                                                                                                  | `onForbidden(exchange, problem)`                         |
| `scope-rejected`（`403`）                         | 什么都不做：应用或 `CoSec-Space-Id` 不是该主体可以使用的。重试仍会被拒绝。发出的空间是 `exchange.request.headers['CoSec-Space-Id']`。 | `onScopeRejected(exchange, problem)`，否则 `onForbidden` |
| `too-many-requests`（`429`）                      | 什么都不做，绝不退出登录。`retryAfterSeconds(response)` 给出要等待多久。                                                              | 无                                                       |
| `unavailable`（`503`）、`internal-error`（`500`） | 什么都不做：会话保留                                                                                                                  | 无                                                       |
| 没有 CoSec problem 的响应，或不认识的类型         | 与以前一致：401 刷新一次，403 报告给 `onForbidden`                                                                                    | `onUnauthorized(exchange)`、`onForbidden(exchange)`      |

回调不会将失败请求变成成功结果；除了显示登录或错误界面，也要捕获请求拒绝。没有 token 可发送的请求，以及刷新调用，都不带 `CoSec-Space-Id`：声明了空间的匿名请求会被拒绝为 `401 unauthorized`。

刷新失败只在刷新路由返回 `401` 时才结束会话。其他任何失败都保留会话并抛 `RefreshUnavailableError`，其 `problem` 说明 CoSec 回答了什么。`429` 还会让客户端在其 `Retry-After` 之前不再调用该路由。刷新因另一个标签页已用掉一次性刷新令牌而失败时，本标签页会重新读取存储，并用那个标签页存入的令牌继续。

**响应丢失的刷新**会在服务端 leeway 之内用同一对 token 重试；超出之后再重试是一场赌博，见[轮换下的刷新](../../reference/cosec/tokens-and-refresh#refresh-under-rotation)。同一会话的**各标签页**必须共享一个存储并轮流刷新：即带 Web Locks 的 `localStorage`（默认），或你用 `new TokenStorage({ sharedAcrossTabs: true })` 声明的其他存储。使用 `sessionStorage`（复制的标签页一开始就带着那对 token 的副本）、每个标签页各自的内存存储，或没有 `navigator.locks`（非安全上下文）时，持有同一对 token 的两个持有者各自刷新，其中一个下次刷新就会撤销会话：只在一个地方刷新。

无需服务端即可测试：使用内存令牌/设备存储，以及按上表返回 `application/problem+json` 的模拟 fetch。覆盖有效令牌、访问令牌过期但刷新令牌有效、并发请求、被拒绝（`401`）的刷新与仅被限流（`429`）的刷新、丢失的刷新响应，以及每种 problem 类型。

## 5. 清理所有者

当前 `TokenStorage` 默认使用按存储 key 命名的广播总线；其他上下文需要匹配通道和支持的 messenger。这与默认只使用本地总线的普通 `KeyStorage` 不同。广播只是变更通知；跨标签页的刷新本身由 Web Lock 串行化，而不是由广播。

应用关闭时停止尚未完成的应用任务，并调用 `session.dispose()`。每个存储的 `destroy()` 释放自己的处理器并关闭自己创建的广播总线，不删除令牌；退出登录需另外调用 `signOut()`。 存储通知是异步的：退出登录后通知仍在投递时，不要立即销毁会话。投递中关闭总线可能中断广播并记录错误。不要销毁其他所有者仍在共享的总线。配置器没有 dispose 方法；本例随会话一起停止使用私有 Fetcher。

查阅[配置](../../reference/cosec/configuration)和[令牌刷新与存储](../../reference/cosec/tokens-and-refresh)。

[tokenStorage.ts:110](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L110) 创建默认广播总线。

[评估集成边界](../../architecture/integration-decisions.md)；[返回本组任务](./index.md)。
