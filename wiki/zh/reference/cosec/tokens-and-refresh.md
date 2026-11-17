---
title: 'Token 与刷新'
description: 'Token 与刷新 — Fetcher 6.0.0'
---

# Token 与刷新

Token 解析只进行本地解码与过期管理，不验证签名、issuer、audience 或权限；服务端仍是鉴权依据。

## JWT 值与序列化

| API                                                         | 输入/默认值                                               | 返回/行为                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseJwtPayload<T extends JwtPayload>(token)`              | 三段点号分隔字符串                                        | T 或 null；base64url/UTF-8 JSON payload 解码；解析错误记录日志并返回 null；payload 不是 JSON 对象（数字、字符串、数组、null）时返回 null；不验证 claim 形状 |
| `isTokenExpired(token, earlyPeriod=0)`                      | 字符串或 CoSecJwtPayload；earlyPeriod 单位秒              | 无法解析（含非对象 payload）、exp 非法/非有限值或 now >= exp-earlyPeriod 为 true；exp 缺失/null 不过期                                                      |
| `JwtToken<Payload>(token, earlyPeriod=0)`                   | 原始字符串                                                | readonly token/payload/earlyPeriod；isExpired 按当前时钟计算                                                                                                |
| `JwtCompositeToken(token, earlyPeriod=0, sessionId=随机值)` | CompositeToken                                            | access、refresh 为 JwtToken；isRefreshNeeded=access 过期，isRefreshable=refresh 有效，authenticated=access 有效                                             |
| `JwtCompositeTokenSerializer(earlyPeriod=0)`                | 提前过期量                                                | serialize→原始 token 加 sessionId 的 JSON；deserialize→使用指定提前量的 JwtCompositeToken                                                                   |
| `deserializeLegacy(value)`                                  | 含 token.accessToken 和 token.refreshToken 字符串的旧对象 | 重建可用类实例；旧形状无效时抛 TypeError                                                                                                                    |
| `jwtCompositeTokenSerializer`                               | 单例，提前量 0                                            | 默认独立序列化器                                                                                                                                            |

`JwtPayload` 声明必填 jti/sub/exp/iat，可选 iss/aud/nbf。`CoSecJwtPayload` 添加 tenantId、policies、roles、attributes，以及自 CoSec 8.0 起仅供显示的会话 claim `sid`、`auth_time`。客户端只把 `roles` 与 `policies` 当作显示数据：CoSec 8.0 在它们为空、或令牌带有 `cosec.membership: "provider"` 时会省略它们，所以缺失并不表示“没有角色”。`IJwtToken<Payload>` 将 token/payload/isExpired 与 `EarlyPeriodCapable` 合并。`RefreshTokenStatusCapable` 提供 readonly isRefreshNeeded/isRefreshable。`AccessToken`、`RefreshToken` 各有一个字符串字段，`CompositeToken` 合并二者。

deserialize 的 JSON 解析错误会传播；解析结果不是 composite token（非数组对象且 accessToken、refreshToken 均为字符串）时抛 TypeError，TokenStorage 随即移除该存储记录并视为不存在，不会发送 `Bearer undefined`。新登录生成随机 sessionId；反序列化保留非空已存 sessionId，否则推导稳定旧协议标识。旧标识用于会话管理，不是密码学完整性验证。

## TokenStorage

`TokenStorage(options={})` 继承 KeyStorage&lt;JwtCompositeToken&gt;。选项为去掉 serializer 的部分 KeyStorageOptions，加 earlyPeriod 与 `sharedAcrossTabs`。默认 key=`DEFAULT_COSEC_TOKEN_KEY`（`cosec-token`）、earlyPeriod=0、以实际 key 命名的 serial 总线，仅当存储被各标签页共享时再包装为跨标签页广播总线（由 `destroy()` 关闭，通过 `eventBus` 传入的总线保持打开）以及继承的环境存储。`sharedAcrossTabs` 默认取决于存储是否为浏览器 `localStorage`；对各标签页共享的其他存储（IndexedDB 或 Cookie 支撑的 `Storage`）声明 `true`，它就同样获得刷新锁与广播总线；声明 `false` 则退出。只有确实共享时才声明。序列化器内部选择。共享事件总线的实例必须使用相同 earlyPeriod，否则构造抛错。

| 成员                                | 结果                                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| `signIn(compositeToken)`            | void；设置新的 JwtCompositeToken/会话                            |
| `setCompositeToken(compositeToken)` | signIn 别名                                                      |
| `signOut()`                         | void；移除 token（及随之而去的刷新尝试记录）并发出继承的存储事件 |
| `authenticated`                     | 仅存储的 access token 未过期时为 true                            |
| `currentUser`                       | CoSecJwtPayload 或 null；未鉴权时为 null                         |
| `get/set/remove/destroy/eventBus`   | 继承 KeyStorage API 与清理所有权                                 |

过期本身不会安排事件或自动刷新，状态 getter 在读取时计算当前时间。不会创建后台刷新定时器。

## 刷新管理器与传输

`new JwtTokenManager(tokenStorage, tokenRefresher, options?)` 暴露这些依赖与选项、currentToken（token/null）及状态 getter（无 token 时为 false）。`refresh(exchange?): Promise<void>` 在无 token 时拒绝并抛 Error('No token found')。同一 manager 对同一当前 token 的并发刷新共用 Promise。跨标签页时，若 token 存储被各标签页共享（默认为浏览器的 `localStorage`，或声明 `sharedAcrossTabs: true`）且存在 Web Locks（`navigator.locks`），刷新在锁 `cosec-refresh:<token 存储 key>` 下进行：共享该存储的标签页依次刷新，等待过的标签页先重新读取存储，若另一标签页已为同一会话存入 token 就直接复用，而不再使用已用过的 refresh token；仅当存储中仍是自己的 token 时才刷新（会话已变或已退出登录则抛 `RefreshSessionChangedError`，不刷新）。没有 Web Locks、不在浏览器中（服务端一个进程在同一 key 下持有多个用户的存储），或存储未声明为共享时，各标签页独立刷新；持有同一对 token 时，CoSec 8.0 会因此处罚：见[轮换下的刷新](#refresh-under-rotation)。存储刷新结果前，manager 用 `tokenStorage.reload()` 重新读取存储，因为其他标签页的登录和退出不经过刷新锁，其变更事件可能尚未送达：同会话较新的 token 优先于迟到的刷新结果并被复用；存储中已退出登录或换成其他会话时，阻止陈旧回写并抛出 `RefreshSessionChangedError(cause?)`。

`JwtTokenManagerOptions`：

| 选项                       | 默认值                                                                        | 契约                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `isRefreshRejected(error)` | `isRefreshRejection`                                                          | 刷新失败的错误是否意味着会话结束。默认是刷新路由返回 `401`（或响应不是 composite token）；其他失败都保留会话。 |
| `rotationLeeway`           | `DEFAULT_ROTATION_LEEWAY`                                                     | 毫秒（30000）。**至多等于服务端的 `cosec.jwt.session.rotation-leeway`**，客户端无法读取它。                    |
| `refreshRetryDelays`       | `[]`（`CoSecConfigurer`：`DEFAULT_REFRESH_RETRY_DELAYS`，先 500 毫秒再 2 秒） | 结果未知的刷新在窗口内于同一次调用中重试前的停顿；长度即重试次数。                                             |

刷新失败时，manager 用 `tokenStorage.reload()` 重新读取存储：如果另一个标签页已刷新同一会话（因此一次性 refresh token 在这里失败）并存入了新 token，就复用该 token，请求继续。刷新响应若缺少字符串类型的 `accessToken` 与 `refreshToken`，绝不存储。存储中仍是刷新失败的那个 token 时，后续处理取决于服务端是否结束了会话：

| 刷新失败                                                                                                                                                                                                                           | 会话       | 抛出的错误                               | `onUnauthorized`           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------- | -------------------------- |
| 刷新端点返回 **401**（CoSec 8.0：`token-revoked`、`token-expired` 或 `token-invalid`；错误带有 `exchange.response.status`，刷新客户端拒绝时使用的 `ExchangeError`/`HttpStatusValidationError` 即如此），或响应不是 composite token | 删除 token | `RefreshTokenError(token, cause?)`       | 调用，并带上刷新的 problem |
| 其他情况：**429**、400、403、404、5xx、网络错误、超时、中止、没有响应的错误                                                                                                                                                        | 保留 token | `RefreshUnavailableError(token, cause?)` | 不调用                     |

两个错误都暴露 `problem?: CoSecProblem`，即 CoSec 的回答。`429` 是限流，不是对会话的裁决：客户端在其 `Retry-After`（最多一分钟）之前不会再调用该路由。`token-expired` 也是对匿名调用方关闭的刷新路由给出的回答（它携带的访问令牌已过期，因而是匿名的），客户端无法区分二者。自定义 `TokenRefresher` 以同样方式表示拒绝：用 `exchange.response.status` 为 401 的错误拒绝（同步抛出也按同样方式处理），或传入 `isRefreshRejected` 采用其他规则。`CoSecTokenRefresher` 通过注册 Symbol 标记而非 `instanceof` 识别，因此由该包另一份副本（与 ES 模块构建并存的 CommonJS 构建）创建的实例，刷新请求与业务请求之间仍只共享一次 `onUnauthorized` 通知。抛出 `RefreshUnavailableError` 后用户仍保持登录，之后的请求会再次刷新。两个错误的 `cause` 都是刷新失败的原因；若刷新请求因其错误拦截器回调（如 `onUnauthorized`）抛错而失败，`cause` 是该请求的 `ExchangeError`，其 `cause` 才是回调错误。两个错误都暴露旧 JwtCompositeToken，日志应避免输出原始凭据。重试业务请求失败保持原错误传播，不移除已经刷新成功的凭据。finally 会清理待完成 Promise。未授权通知所有权与 exchange 错误处理器协调，不是通用事件队列。

### 轮换下的刷新 {#refresh-under-rotation}

CoSec 8.0 在每次刷新时轮换会话（`IDN-15`..`IDN-17`）。刚被替换的那对 token，在轮换后的 `cosec.jwt.session.rotation-leeway`（30 秒）内会得到当前代的新 token，且不会再次推进会话；更旧的一对，或超过该时间后的那一对，会**撤销整个会话**。服务端推进会话的时刻不早于客户端发出请求的时刻，因此客户端能做什么，取决于第一次结果未知的尝试的时间（超时、响应丢失、5xx：服务端可能已记录这次推进）：

| 情形                                                          | 客户端的做法                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 一对 token 的第一次尝试                                       | 把时间与这对 token 一起记录（同一存储，因此刷新页面或使用该存储的其他标签页都知道），然后发送。这个时间从不后移。                                                                                                                                                                                                                            |
| 结果未知，**在窗口内**（自该时间起 `rotationLeeway` 减 5 秒） | 用同一对 token 重试：同一次调用中最多 `refreshRetryDelays.length` 次，之后的任何请求也会重试。这是安全的：无论第一次尝试结果如何，服务端都会在其 leeway 内应答再次出示的同一对 token。                                                                                                                                                       |
| 结果未知，**窗口已过**                                        | **无法做到安全。** 每次调用只尝试一次（调用是单飞的），仍用同一对 token。若第一次尝试根本没到达服务端（移动网络上常见的超时），它能保住会话；若服务端已记录，它会撤销会话，此时新的一对已经丢失，用户本来就得重新登录。随后的 `401` 会正常结束会话，problem 为 `token-revoked`。运维人员可能在审计里把这样的重试看作被再次出示的一对 token。 |
| 管线在处理器运行前拒绝（`429`、`400`、`403` 等）              | 什么都没推进：解决它所开启的那次尝试（更早的未决尝试仍保留）。`429` 在其 `Retry-After` 之前不会重复。                                                                                                                                                                                                                                        |
| 存入了新的一对，或会话结束                                    | 尝试记录随之消失。                                                                                                                                                                                                                                                                                                                           |

`CoSecTokenRefresher` 在 `DEFAULT_REFRESH_TIMEOUT`（10 秒，即其 `timeout` 选项）后掐断刷新请求，避免挂起的请求耗尽窗口。**标签页：** 持有同一对 token 的两个持有者各自刷新，会在其中一个下次刷新时结束会话，所以一个会话需要一个共享存储和一把锁（带 Web Locks 的 `localStorage`，或对各标签页共享的存储声明 `sharedAcrossTabs: true`）。`sessionStorage`（复制的标签页一开始就带着那对 token 的副本）、每个标签页各自的内存存储、未声明共享的自定义存储，以及没有 `navigator.locks` 的非安全上下文，都无法做到安全：只在一个地方刷新。对于跨源的浏览器客户端，若主机在 CoSec 之前没有 CORS 过滤器，被拒绝的刷新看起来就像网络错误，也就是结果未知。

`TokenRefresher.refresh(token): Promise<CompositeToken>` 是自定义传输契约。`CoSecTokenRefresher({fetcher, endpoint, timeout?})` 前两个字段必填，以 POST 发送 token 对象并提取 JSON，在 `timeout`（默认 `DEFAULT_REFRESH_TIMEOUT`，10000 毫秒；0 表示不限）后掐断请求。具体类的 refresh 还接受 `shouldNotifyUnauthorized?: () => boolean`。它设置 `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` 防止递归刷新；自定义传输若使用已配置 Fetcher，需要自行提供该属性。

## 完整内存示例

示例仅在本地解码故意构造的模拟 token，不连接鉴权服务。它演示存储状态，不会签发有效凭据。

```ts
import { TokenStorage } from '@ahoo-wang/fetcher-cosec';
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const tokens = new TokenStorage({
  storage: new InMemoryStorage(),
  eventBus: new SerialTypedEventBus('example-token'),
});
const payload = {
  jti: 'demo',
  sub: 'user-1',
  iat: 0,
  exp: Math.floor(Date.now() / 1000) + 3600,
};
const jwt = `e30.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.demo`;
try {
  tokens.signIn({ accessToken: jwt, refreshToken: jwt });
  console.log(tokens.authenticated, tokens.currentUser?.sub);
  tokens.signOut();
} finally {
  tokens.destroy();
}
```

<span id="jwtpayload"></span>

**`JwtPayload`** — [packages/cosec/src/jwts.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L17)

<span id="cosecjwtpayload"></span>

**`CoSecJwtPayload`** — [packages/cosec/src/jwts.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L61)

<span id="parsejwtpayload"></span>

**`parseJwtPayload`** — [packages/cosec/src/jwts.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L95)

<span id="earlyperiodcapable"></span>

**`EarlyPeriodCapable`** — [packages/cosec/src/jwts.ts:136](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L136)

<span id="istokenexpired"></span>

**`isTokenExpired`** — [packages/cosec/src/jwts.ts:159](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L159)

<span id="ijwttoken"></span>

**`IJwtToken`** — [packages/cosec/src/jwtToken.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L47)

<span id="jwttoken"></span>

**`JwtToken`** — [packages/cosec/src/jwtToken.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L82)

<span id="refreshtokenstatuscapable"></span>

**`RefreshTokenStatusCapable`** — [packages/cosec/src/jwtToken.ts:130](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L130)

<span id="jwtcompositetoken"></span>

**`JwtCompositeToken`** — [packages/cosec/src/jwtToken.ts:169](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L169)

<span id="jwtcompositetokenserializer"></span>

**`JwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:258](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L258)

<span id="jwtcompositetokenserializer-instance"></span>

**`jwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:332](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L332)

<span id="refreshtokenerror"></span>

**`RefreshTokenError`** — [packages/cosec/src/errors.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L18)

<span id="refreshsessionchangederror"></span>

**`RefreshSessionChangedError`** — [packages/cosec/src/errors.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L37)

<span id="refreshunavailableerror"></span>

**`RefreshUnavailableError`** — [packages/cosec/src/errors.ts:51](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/errors.ts#L51)

<span id="jwttokenmanager"></span>

**`JwtTokenManager`** — [packages/cosec/src/jwtTokenManager.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L140)

<span id="default_cosec_token_key"></span>

**`DEFAULT_COSEC_TOKEN_KEY`** — [packages/cosec/src/tokenStorage.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L26)

<span id="tokenstorageoptions"></span>

**`TokenStorageOptions`** — [packages/cosec/src/tokenStorage.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L47)

<span id="tokenstorage-api"></span>

**`TokenStorage`** — [packages/cosec/src/tokenStorage.ts:74](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L74)

<span id="accesstoken"></span>

**`AccessToken`** — [packages/cosec/src/tokenRefresher.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L31)

<span id="refreshtoken"></span>

**`RefreshToken`** — [packages/cosec/src/tokenRefresher.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L44)

<span id="compositetoken"></span>

**`CompositeToken`** — [packages/cosec/src/tokenRefresher.ts:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L61)

<span id="tokenrefresher"></span>

**`TokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L77)

<span id="cosectokenrefresheroptions"></span>

**`CoSecTokenRefresherOptions`** — [packages/cosec/src/tokenRefresher.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L122)

<span id="cosectokenrefresher"></span>

**`CoSecTokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:159](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L159)

<span id="jwttokenmanageroptions"></span>

**`JwtTokenManagerOptions`** — [packages/cosec/src/jwtTokenManager.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L81)

<span id="isrefreshrejection"></span>

**`isRefreshRejection`** — [packages/cosec/src/jwtTokenManager.ts:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L72)

<span id="default_rotation_leeway"></span>

**`DEFAULT_ROTATION_LEEWAY`** — [packages/cosec/src/jwtTokenManager.ts:110](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L110)

<span id="rotation_leeway_margin"></span>

**`ROTATION_LEEWAY_MARGIN`** — [packages/cosec/src/jwtTokenManager.ts:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L117)

<span id="default_refresh_retry_delays"></span>

**`DEFAULT_REFRESH_RETRY_DELAYS`** — [packages/cosec/src/jwtTokenManager.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L120)

<span id="default_refresh_timeout"></span>

**`DEFAULT_REFRESH_TIMEOUT`** — [packages/cosec/src/tokenRefresher.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L120)
