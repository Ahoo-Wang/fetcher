---
title: 安装 Fetcher
description: 创建独立 ESM 项目并安装核心 HTTP 客户端。
---

# 安装 Fetcher

核心包支持 Node `>=18.20.8`。先创建独立目录，使样例不依赖本仓库的 workspace 链接：

```bash
mkdir fetcher-first-request
cd fetcher-first-request
```

创建启用 ESM 的 `package.json`：

```json
{
  "name": "fetcher-first-request",
  "private": true,
  "type": "module"
}
```

安装已发布的客户端与 TypeScript：

```bash
pnpm add @ahoo-wang/fetcher
pnpm add -D typescript
```

以上是消费者项目的设置。参与本仓库开发则需要 Node `>=22.12.0`、pnpm `10.34.5`，并使用[开发指南](../contributing/development.md)中的命令。

安装后继续[第一个请求](./first-request.md)。

## React 与 Viewer 起点

已有 React 应用请使用 [React 示例的完整 peer 安装与挂载步骤](../examples/react.md)。需要在 5.x 线上使用表格时见[第一张数据表](./first-view.md)。这两条路径的 UI 依赖与核心 HTTP 安装不同；先按[起点选择](./index.md)确定任务。

## Wow 仓库中的包

Wow 客户端、Wow React Hook、生成器和数据视图组件已迁往 [Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)。它们的后继包尚未发布到 npm，随 Wow 首个稳定版发布；在此之前使用 5.x 线（npm 5.1.x），见[已迁出的包](../architecture/package-boundaries.md#packages-that-moved-to-the-wow-repository)。
