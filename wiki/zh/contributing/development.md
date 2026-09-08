---
title: 准备 Monorepo 开发环境
description: 准备 Monorepo 开发环境 — Fetcher
---

# 准备 Monorepo 开发环境

## 使用仓库声明的工具链

根 package.json 声明 Node `>=20.20.2`、pnpm `10.34.5`。库消费者有各自的 engines 和 peer 要求，见[安装](../start/installation.md)。

```bash
pnpm install --frozen-lockfile
pnpm build
```

Workspace 包含 packages、integration-test 与 wiki。目标包依赖其他包产物时，先构建依赖。

## 聚焦一个包

```bash
pnpm --filter @ahoo-wang/fetcher-react... build
pnpm --filter @ahoo-wang/fetcher-react test
pnpm --filter @ahoo-wang/fetcher exec vitest run test/fetcher.test.ts
```

末尾 `...` 包含 workspace 依赖。以各 package.json 脚本和 Vitest 配置确定环境，不要假设测试都在 src 目录。

## 保持差异可审阅

使用严格 TypeScript、ES modules、type-only imports 和 Apache 头。根 pnpm lint 会自动修复，pnpm format 会重写仓库；优先仅检查修改文件，并审阅输出差异。

新增包、修改根 TypeScript 或构建配置前需获得批准，除非任务已授权。外部依赖版本放 workspace catalog，内部依赖使用 workspace 协议。版本变更获得授权后，通过 `pnpm update-version <version>` 保持包版本一致。
