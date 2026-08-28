---
title: 测试
description: 运行正确的 Fetcher 单元、集成、浏览器、Wiki 与 Storybook 检查。
---

# 测试

## 测试矩阵

| 范围               | 命令                           | 证明内容                     |
| ------------------ | ------------------------------ | ---------------------------- |
| 全部包单测         | `pnpm test:unit`               | 包行为、类型与覆盖率         |
| 单个包             | `pnpm --filter <package> test` | 聚焦包行为                   |
| 集成工作区         | `pnpm test:it`                 | 生成客户端与服务集成         |
| Storybook 交互     | `pnpm test:storybook`          | Chromium 渲染与 `play` 断言  |
| Storybook 静态构建 | `pnpm build-storybook`         | 生产故事编译                 |
| Wiki               | `pnpm --dir wiki build`        | Markdown、Mermaid 与链接渲染 |

## 单元测试

Vitest globals 已启用。测试与源码相邻；Fetcher 包需要 HTTP 边界时使用 MSW；只有真实
浏览器行为才使用 browser provider。

```bash
pnpm --filter @ahoo-wang/fetcher-viewer vitest run \
  src/filter/TextFilter.test.tsx
```

## 集成测试

先构建包。集成工作区可能从实时测试服务生成代码，因此需确认其文档化前置条件，不要把
服务缺失误判为单元测试回归。

```bash
pnpm build
pnpm test:it
```

## Storybook

Story 使用确定性本地夹具替换网络、流与时间边界，同时运行真实包代码。所有 Story 必须在
Chromium 中渲染，关键行为写入 `play` 断言。任何 Story 都不得访问公网或要求凭据。

## 提交前

迭代时运行聚焦检查，随后运行 `pnpm test:unit`。公开 UI 或文档变更还需运行对应构建与
交互检查。警告不等同失败，但接受新警告前应先完成诊断。
