# `@ahoo-wang/fetcher-cosec`

面向 Fetcher 的 CoSec 请求归属与可选 JWT 认证。服务端契约要求 CoSec 应用、设备、
请求、空间或 Bearer Token 行为时使用。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus \
  @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-cosec
```

Peer 依赖：`fetcher`、`fetcher-eventbus` 和 `fetcher-storage`。

## 示例

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';

const api = new Fetcher({ baseURL: 'https://api.example.com' });

const cosec = new CoSecConfigurer({
  appId: 'developer-console',
  onUnauthorized: () => window.location.assign('/login'),
  onForbidden: async () => console.error('Access denied'),
});

cosec.applyTo(api);
```

该最小配置只添加归属请求头，不启用认证。提供 `TokenRefresher` 后会启用令牌存储、
Bearer 注入与自动刷新。刷新请求使用独立、未配置 CoSec 的 Fetcher。

## 核心能力

- 应用、设备、请求、空间、租户与所有者归属。
- JWT 解析、持久化、登录、退出与当前用户读取。
- 合并并发自动刷新，并防止递归刷新。
- 可配置 401 与 403 回调。
- 为自定义管线提供独立拦截器。

切勿记录、嵌入或提交真实令牌。

## 文档

- [CoSec 认证实战](https://fetcher.ahoo.me/zh/recipes/cosec-authentication)
- [CoSec 参考](https://fetcher.ahoo.me/zh/reference/cosec)

[English](./README.md) · [许可证](../../LICENSE)
