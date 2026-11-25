---
next: false
title: 把 CoSec 认证迁到 CoSec 的包
description: 用 CoSec 仓库的包替换 fetcher-cosec 与 fetcher-react 的安全 Hook；服务端仍是 CoSec 7.x 时留在 fetcher 6.x。
---

# 把 CoSec 认证迁到 CoSec 的包

Fetcher 8.0 不再包含任何 CoSec 代码。CoSec 客户端及其 React Hook 现在位于 [CoSec 仓库](https://github.com/Ahoo-Wang/CoSec)的 `typescript/` 下，随 CoSec 发布，版本号与 CoSec 一致。它们依赖 fetcher 的包；fetcher 里没有任何东西依赖它们。

| Fetcher 6.x                                                                                                          | CoSec 8                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `@ahoo-wang/fetcher-cosec`                                                                                           | `@ahoo-wang/cosec-fetcher` |
| `@ahoo-wang/fetcher-react` 里的 `SecurityProvider`、`useSecurity`、`RouteGuard`、`RefreshableRouteGuard` 等安全 Hook | `@ahoo-wang/cosec-react`   |

`@ahoo-wang/fetcher-react` 的其余部分在 8.0 中没有变化。

## 按服务端的 CoSec 版本选择

| 服务端运行 | 使用                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| CoSec 8    | Fetcher 8，配合 `@ahoo-wang/cosec-fetcher`；React 应用再加 `@ahoo-wang/cosec-react`。它们实现 CoSec 8 协议。                                  |
| CoSec 7.x  | 留在 fetcher 6.x：`@ahoo-wang/fetcher-cosec` 6.x 继续对接 CoSec 7，并从 [`6.x` 分支](https://github.com/Ahoo-Wang/fetcher/tree/6.x)接收修复。 |

`@ahoo-wang/fetcher-cosec` 不会发布 fetcher 8 的版本。先把服务端升级到 CoSec 8，再把客户端迁到 fetcher 8。

## 步骤

1. 把服务端升级到 CoSec 8。
2. 从应用中移除 `@ahoo-wang/fetcher-cosec`，并把 `@ahoo-wang/fetcher*` 各包升级到 8。
3. 安装 CoSec 的包。CoSec 8.0 正式发布之前它们在 npm 的 `rc` 标签上：

   ```bash
   pnpm add @ahoo-wang/cosec-fetcher@rc
   pnpm add @ahoo-wang/cosec-react@rc   # React 应用
   ```

4. 按 CoSec 文档里的新旧对照改写导入与配置：[cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients)。该页列出旧包每个导出的去向；请照它改写，不要假定只是换个导入路径。

[返回本任务组](./index.md)；[查看集成边界](../../architecture/integration-decisions.md)。
