---
title: 'Token 与刷新'
description: 'Token 与刷新 — Fetcher 5.0.0'
---

# Token 与刷新

Token 解析只进行本地解码与过期管理，不验证签名、issuer、audience 或权限；服务端仍是鉴权依据。

## JWT 值与序列化

| API                                                         | 输入/默认值                                               | 返回/行为                                                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `parseJwtPayload<T extends JwtPayload>(token)`              | 三段点号分隔字符串                                        | T 或 null；base64url/UTF-8 JSON payload 解码；解析错误记录日志并返回 null，不验证 claim 形状                    |
| `isTokenExpired(token, earlyPeriod=0)`                      | 字符串或 CoSecJwtPayload；earlyPeriod 单位秒              | 无法解析、exp 非法/非有限值或 now >= exp-earlyPeriod 为 true；exp 缺失/null 不过期                              |
| `JwtToken<Payload>(token, earlyPeriod=0)`                   | 原始字符串                                                | readonly token/payload/earlyPeriod；isExpired 按当前时钟计算                                                    |
| `JwtCompositeToken(token, earlyPeriod=0, sessionId=随机值)` | CompositeToken                                            | access、refresh 为 JwtToken；isRefreshNeeded=access 过期，isRefreshable=refresh 有效，authenticated=access 有效 |
| `JwtCompositeTokenSerializer(earlyPeriod=0)`                | 提前过期量                                                | serialize→原始 token 加 sessionId 的 JSON；deserialize→使用指定提前量的 JwtCompositeToken                       |
| `deserializeLegacy(value)`                                  | 含 token.accessToken 和 token.refreshToken 字符串的旧对象 | 重建可用类实例；旧形状无效时抛 TypeError                                                                        |
| `jwtCompositeTokenSerializer`                               | 单例，提前量 0                                            | 默认独立序列化器                                                                                                |

`JwtPayload` 声明必填 jti/sub/exp/iat，可选 iss/aud/nbf。`CoSecJwtPayload` 添加 tenantId、policies、roles、attributes。`IJwtToken<Payload>` 将 token/payload/isExpired 与 `EarlyPeriodCapable` 合并。`RefreshTokenStatusCapable` 提供 readonly isRefreshNeeded/isRefreshable。`AccessToken`、`RefreshToken` 各有一个字符串字段，`CompositeToken` 合并二者。

deserialize 的 JSON 解析错误会传播。新登录生成随机 sessionId；反序列化保留非空已存 sessionId，否则推导稳定旧协议标识。旧标识用于会话管理，不是密码学完整性验证。

## TokenStorage

`TokenStorage(options={})` 继承 KeyStorage&lt;JwtCompositeToken&gt;。选项为去掉 serializer 的部分 KeyStorageOptions 加 earlyPeriod。默认 key=`DEFAULT_COSEC_TOKEN_KEY`（`cosec-token`）、earlyPeriod=0、广播总线（serial delegate 名称取实际 key）以及继承的环境存储。序列化器内部选择。共享事件总线的实例必须使用相同 earlyPeriod，否则构造抛错。

| 成员                                | 结果                                     |
| ----------------------------------- | ---------------------------------------- |
| `signIn(compositeToken)`            | void；设置新的 JwtCompositeToken/会话    |
| `setCompositeToken(compositeToken)` | signIn 别名                              |
| `signOut()`                         | void；移除 token 并发出继承的存储事件    |
| `authenticated`                     | 仅存储的 access token 未过期时为 true    |
| `currentUser`                       | CoSecJwtPayload 或 null；未鉴权时为 null |
| `get/set/remove/destroy/eventBus`   | 继承 KeyStorage API 与清理所有权         |

过期本身不会安排事件或自动刷新，状态 getter 在读取时计算当前时间。不会创建后台刷新定时器。

## 刷新管理器与传输

`new JwtTokenManager(tokenStorage, tokenRefresher)` 暴露两个依赖、currentToken（token/null）及状态 getter（无 token 时为 false）。`refresh(exchange?): Promise<void>` 在无 token 时拒绝并抛 Error('No token found')。同一 manager 对同一当前 token 的并发刷新共用 Promise，不是跨标签页分布式锁。同会话较新 token 优先于迟到的刷新结果。退出登录或切换会话会阻止陈旧回写，并抛出 `RefreshSessionChangedError(cause?)`。

刷新仍属于当前会话且失败时，删除该会话 token 并抛 `RefreshTokenError(token, cause?)`。错误暴露旧 JwtCompositeToken，日志应避免输出原始凭据。重试业务请求失败保持原错误传播，不移除已经刷新成功的凭据。finally 会清理待完成 Promise。未授权通知所有权与 exchange 错误处理器协调，不是通用事件队列。

`TokenRefresher.refresh(token): Promise<CompositeToken>` 是自定义传输契约。`CoSecTokenRefresher({fetcher, endpoint})` 两字段必填，以 POST 发送 token 对象并提取 JSON。具体类的 refresh 还接受 `shouldNotifyUnauthorized?: () => boolean`。它设置 `IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` 防止递归刷新；自定义传输若使用已配置 Fetcher，需要自行提供该属性。

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

**`parseJwtPayload`** — [packages/cosec/src/jwts.ts:91](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L91)

<span id="earlyperiodcapable"></span>

**`EarlyPeriodCapable`** — [packages/cosec/src/jwts.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L122)

<span id="istokenexpired"></span>

**`isTokenExpired`** — [packages/cosec/src/jwts.ts:145](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwts.ts#L145)

<span id="ijwttoken"></span>

**`IJwtToken`** — [packages/cosec/src/jwtToken.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L42)

<span id="jwttoken"></span>

**`JwtToken`** — [packages/cosec/src/jwtToken.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L77)

<span id="refreshtokenstatuscapable"></span>

**`RefreshTokenStatusCapable`** — [packages/cosec/src/jwtToken.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L125)

<span id="jwtcompositetoken"></span>

**`JwtCompositeToken`** — [packages/cosec/src/jwtToken.ts:164](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L164)

<span id="jwtcompositetokenserializer"></span>

**`JwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:253](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L253)

<span id="jwtcompositetokenserializer-instance"></span>

**`jwtCompositeTokenSerializer`** — [packages/cosec/src/jwtToken.ts:325](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtToken.ts#L325)

<span id="refreshtokenerror"></span>

**`RefreshTokenError`** — [packages/cosec/src/jwtTokenManager.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L25)

<span id="refreshsessionchangederror"></span>

**`RefreshSessionChangedError`** — [packages/cosec/src/jwtTokenManager.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L37)

<span id="jwttokenmanager"></span>

**`JwtTokenManager`** — [packages/cosec/src/jwtTokenManager.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/jwtTokenManager.ts#L48)

<span id="default_cosec_token_key"></span>

**`DEFAULT_COSEC_TOKEN_KEY`** — [packages/cosec/src/tokenStorage.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L27)

<span id="tokenstorageoptions"></span>

**`TokenStorageOptions`** — [packages/cosec/src/tokenStorage.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L48)

<span id="tokenstorage-api"></span>

**`TokenStorage`** — [packages/cosec/src/tokenStorage.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenStorage.ts#L58)

<span id="accesstoken"></span>

**`AccessToken`** — [packages/cosec/src/tokenRefresher.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L28)

<span id="refreshtoken"></span>

**`RefreshToken`** — [packages/cosec/src/tokenRefresher.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L41)

<span id="compositetoken"></span>

**`CompositeToken`** — [packages/cosec/src/tokenRefresher.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L58)

<span id="tokenrefresher"></span>

**`TokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:74](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L74)

<span id="cosectokenrefresheroptions"></span>

**`CoSecTokenRefresherOptions`** — [packages/cosec/src/tokenRefresher.ts:111](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L111)

<span id="cosectokenrefresher"></span>

**`CoSecTokenRefresher`** — [packages/cosec/src/tokenRefresher.ts:142](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/tokenRefresher.ts#L142)
