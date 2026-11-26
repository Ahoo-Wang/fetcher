---
next: false
title: 把 CoSec 认证迁到 CoSec 的包
description: 用接受 fetcher 8 的 CoSec 8.0.0 及以上版本替换 fetcher-cosec 与 fetcher-react 的安全 Hook；服务端仍是 CoSec 7.x 时留在 fetcher 6.x。
---

# 把 CoSec 认证迁到 CoSec 的包

Fetcher 8.0 不再包含任何 CoSec 代码。CoSec 客户端及其 React Hook 现在位于 [CoSec 仓库](https://github.com/Ahoo-Wang/CoSec)的 `typescript/` 下，随 CoSec 发布，版本号与 CoSec 一致。它们依赖 fetcher 的包；fetcher 里没有任何东西依赖它们。

| Fetcher 6.x                                                                                                          | CoSec 8                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `@ahoo-wang/fetcher-cosec`                                                                                           | `@ahoo-wang/cosec-fetcher` |
| `@ahoo-wang/fetcher-react` 里的 `SecurityProvider`、`useSecurity`、`RouteGuard`、`RefreshableRouteGuard` 等安全 Hook | `@ahoo-wang/cosec-react`   |

`@ahoo-wang/fetcher-react` 的其余部分在 8.0 中没有变化。

## 装哪个 fetcher 版本

CoSec 的包建在 fetcher 之上：`@ahoo-wang/cosec-fetcher` 把 `@ahoo-wang/fetcher`、`@ahoo-wang/fetcher-eventbus`、`@ahoo-wang/fetcher-storage` 声明为对等依赖，搭配哪个 fetcher 大版本以这些对等依赖范围为准。CoSec 8.0.0 及以上同时接受 fetcher 6（6.1.1 及以上）与 fetcher 8；`8.0.0-rc.1` 及更早的 CoSec 8 候选版只接受 fetcher 6。查看你要安装的版本：

```bash
npm view @ahoo-wang/cosec-fetcher@^8.0.0 peerDependencies
```

| 服务端运行 | 客户端                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CoSec 8    | Fetcher 8，配合 8.0.0 及以上的 `@ahoo-wang/cosec-fetcher`；React 应用再加 `@ahoo-wang/cosec-react`。                                                                           |
| CoSec 7.x  | 留在 fetcher 6.x：`@ahoo-wang/fetcher-cosec` 6.x 继续对接 CoSec 7。[`6.x` 分支](https://github.com/Ahoo-Wang/fetcher/tree/6.x)继续发布修复，在 npm 的 `latest-6` dist-tag 上。 |

`@ahoo-wang/fetcher-cosec` 不会发布 fetcher 8 的版本，所以使用 CoSec 的应用要经由 CoSec 的包升级到 fetcher 8。

## 步骤

1. 把服务端升级到 CoSec 8。
2. 从应用中移除 `@ahoo-wang/fetcher-cosec`，安装 8.0.0 及以上的 CoSec 包。`^8.0.0` 范围只会装到 CoSec 8 的正式版，不会装到候选版：

   ```bash
   pnpm add @ahoo-wang/cosec-fetcher@^8.0.0
   pnpm add @ahoo-wang/cosec-react@^8.0.0   # React 应用
   ```

3. 按 CoSec 文档里的新旧对照改写导入与配置：[cosec.ahoo.me/integration/clients](https://cosec.ahoo.me/integration/clients)。该页列出旧包每个导出的去向；请照它改写，不要假定只是换个导入路径。
4. 把 `@ahoo-wang/fetcher*` 各包升级到 8。CoSec 8.0.0 同时接受 fetcher 6.1.1 及以上，所以这一步放在其它步骤之前或之后都可以。

[返回本任务组](./index.md)；[查看集成边界](../../architecture/integration-decisions.md)。
