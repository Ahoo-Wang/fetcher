# `@ahoo-wang/fetcher-cosec`

> **已弃用。** 本包已迁到 CoSec 仓库，新包名为
> [`@ahoo-wang/cosec-fetcher`](https://www.npmjs.com/package/@ahoo-wang/cosec-fetcher)，
> fetcher 下一个大版本将移除本包。CoSec 8.0 GA 之前新包在 npm 的 `beta` 标签上。
> 迁移与文档见 [https://cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients)。

面向 Fetcher 的 CoSec 请求归属与可选 JWT 认证。服务端契约要求 CoSec 应用、设备、
请求、空间或 Bearer Token 行为时使用。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

Peer 依赖：`fetcher`、`fetcher-eventbus` 和 `fetcher-storage`。

需要 Node `^22.12.0 || ^24.0.0 || >=26.0.0`，即 nanoid 6 支持的 Node 版本，并从 22 系列中首个支持 `require()` 加载 ES 模块的版本起：nanoid 仅提供 ES 模块，CommonJS 入口（`require`）以这种方式加载它。

## 示例

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer, sameOriginTrust } from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.com' });

const cosec = new CoSecConfigurer({
  appId: 'developer-console',
  isTrusted: sameOriginTrust,
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => console.error('Access denied'),
});

cosec.applyTo(api);
```

该最小配置只添加归属请求头，不启用认证。提供 `TokenRefresher` 后会启用令牌存储、
Bearer 注入与自动刷新。刷新请求使用独立、未配置 CoSec 的 Fetcher。

`isTrusted: sameOriginTrust` 让令牌与 CoSec 请求头（含设备 ID）只发往 `baseURL`
所在源与页面自身的源。不设 `isTrusted` 时，发往任意源绝对 URL 的请求都会收到访问令牌。

## 核心能力

- 应用、设备、请求、空间、租户与所有者归属。
- JWT 解析、持久化、登录、退出与当前用户读取。
- 合并并发自动刷新，并防止递归刷新。
- 可配置 401 与 403 回调。
- 用 `isTrusted` / `sameOriginTrust` 按源决定是否携带凭据。
- 为自定义管线提供独立拦截器。

切勿记录、嵌入或提交真实令牌。

## 文档

- [CoSec 认证实战](https://fetcher.ahoo.me/zh/guides/integrations/cosec)
- [CoSec 参考](https://fetcher.ahoo.me/zh/reference/cosec)

[English](./README.md) · [许可证](../../LICENSE)
