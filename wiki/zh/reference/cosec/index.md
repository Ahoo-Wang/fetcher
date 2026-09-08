---
prev: false
title: 'Cosec 参考'
description: 'Cosec 参考 — Fetcher 5.0.0'
---

# Cosec 参考

将 CoSec 请求元数据、资源归属、JWT 存储及刷新接入 Fetcher 拦截器。

## 安装

```bash
pnpm add @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-storage
```

命令包含 CoSec → Storage/EventBus → Fetcher；nanoid 作为普通依赖自动安装。默认 token/device 存储会立即创建广播传输。SSR 请求隔离应注入请求独有的存储与本地总线，见[配置](./configuration.md)。

版本 **5.0.0** 对消费者声明 Node **>=18.20.8**；仓库开发另需 Node **>=20.20.2** 和 pnpm **10.34.5**。

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

对接兼容 CoSec 的服务时用 `CoSecConfigurer` 完成拦截器配置。提供 `tokenRefresher` 才启用托管 Authorization 与刷新；没有它时，只配置元数据、资源归属和显式设置的错误回调。只有应用自行管理顺序与依赖时才单独使用拦截器。

## 专题

- [CoSec 配置](configuration)
- [Token 与刷新](tokens-and-refresh)
- [拦截器与资源归属](interceptors-and-attribution)

[完整公开符号索引](./symbols.md)
