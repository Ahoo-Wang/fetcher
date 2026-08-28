---
title: 开发
description: 安装 Fetcher Monorepo、理解包边界并遵循 TypeScript 工作流。
---

# 开发

## 环境要求

- Node.js 18.20.8 或更高版本
- 通过 Corepack 使用 pnpm 10.34.5
- Git

## 配置仓库

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

当测试可能消费其他工作区包生成的声明或构建产物时，先构建再测试。

## 按包工作

```bash
pnpm --filter @ahoo-wang/fetcher build
pnpm --filter @ahoo-wang/fetcher test
pnpm --filter @ahoo-wang/fetcher vitest run src/fetcher.test.ts
```

核心包没有内部依赖。Decorator、事件总线、流式响应、OpenAI、OpenAPI、Generator、
React、Storage、CoSec、Wow 和 Viewer 分层构建在它之上。共享行为应留在已有且最低的
责任包中。

## 代码风格

- 严格 TypeScript 与 ES Modules。
- 单引号、分号、尾随逗号和 80 列 Prettier 输出。
- ESLint 要求时使用 type-only import。
- `*.test.ts` / `*.test.tsx` 与源码相邻。
- 源文件保留 Apache 2.0 头。
- 通过 `pnpm-workspace.yaml` 的根 catalog 添加依赖。

只有明确进行全仓清理时才运行 `pnpm lint` 与 `pnpm format`；日常变更只格式化聚焦文件。

## 版本与发布

所有包共享一个版本。统一更新：

```bash
pnpm update-version 3.19.0
```

修改公开 API 需要明确版本决策，并同步 Wiki、README 与包 Skill 参考。发布由 release
工作流负责，不属于本地开发步骤。
