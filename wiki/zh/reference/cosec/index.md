---
prev: false
title: 'Cosec 参考'
description: 'Cosec 参考 — Fetcher 6.0.0'
---

# Cosec 参考

将 CoSec 请求元数据、资源归属、JWT 存储及刷新接入 Fetcher 拦截器。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

命令包含 CoSec → Storage/EventBus → Fetcher；nanoid 作为普通依赖自动安装。CoSec 需要 Node `^22.12.0 || ^24.0.0 || >=26.0.0`（其他包声明 `>=18.20.8`），即 nanoid 6 支持的版本：nanoid 仅提供 ES 模块，CoSec 的 CommonJS 入口需要支持 `require()` 加载 ES 模块的 Node。默认 token/device/space 存储仅在值保存于浏览器 `localStorage` 时跨标签页广播；其他环境（Node SSR、`sessionStorage`、注入的存储）中每个默认存储使用自己的总线，因此按请求创建的存储不会通过 `BroadcastChannel` 共享状态。SSR 请求隔离应注入请求独有的存储，见[配置](./configuration.md)。

本包对消费者声明 Node **^22.12.0 || ^24.0.0 || >=26.0.0**；仓库开发另需 Node **>=22.12.0** 和 pnpm **10.34.5**。

## 最小示例

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import { CoSecConfigurer } from '@ahoo-wang/fetcher-cosec';
const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const cosec = new CoSecConfigurer({ appId: 'example-app' });
cosec.applyTo(fetcher);
```

没有 tokenRefresher 时 CoSec 仅安装元数据/归属处理。启用受管理鉴权前请阅读配置页。

## 选择入口

对接兼容 CoSec 的服务时用 `CoSecConfigurer` 完成拦截器配置。提供 `tokenRefresher` 才启用托管 Authorization 与刷新；没有它时，只配置元数据、资源归属和显式设置的错误回调。默认情况下每个请求（包括发往其他源绝对 URL 的请求）都携带 token 与 CoSec 请求头；传 `isTrusted: sameOriginTrust` 可只发给 `baseURL` 所在源与页面自身的源（见[请求信任](./interceptors-and-attribution.md#request-trust)）。只有应用自行管理顺序与依赖时才单独使用拦截器。

## 专题

- [CoSec 配置](configuration)
- [Token 与刷新](tokens-and-refresh)
- [拦截器与资源归属](interceptors-and-attribution)

[完整公开符号索引](./symbols.md)
