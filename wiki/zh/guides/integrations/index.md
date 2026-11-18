---
prev: false
title: 平台集成
description: 按前提选择平台集成的具体任务。
---

# 平台集成

Wow 需要兼容的服务端协议和应用路由。存储与本地事件不需要平台服务。安装前核对所选包的 peer 依赖。

- [发送命令与查询状态](./wow.md)（仅 5.x；6.0 起见 [wow.ahoo.me](https://wow.ahoo.me)）
- [组合存储与事件](./storage-and-events.md)

CoSec 认证已迁到 CoSec 仓库：改用 `@ahoo-wang/cosec-fetcher`（原 `@ahoo-wang/fetcher-cosec`）与 `@ahoo-wang/cosec-react`（原 `@ahoo-wang/fetcher-react` 中的安全 Hook），CoSec 8.0 GA 之前在 npm 的 `beta` 标签上。见 [cosec.ahoo.me](https://cosec.ahoo.me/integration/clients)。

[全部指南](../index.md) · [集成决策](../../architecture/integration-decisions.md)
