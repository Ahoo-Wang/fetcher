---
title: 快速接入数据视图
description: 运行本地示例，连接 ViewDefinition、ViewInstance、ViewHost 与 ViewPage。
---

# 快速接入数据视图

## 运行当前仓库

当前分支的 view-engine 尚未在公共 npm 注册表发布。先从仓库示例开始；独立应用可按[完整示例](../../examples/view-engine.md)中的本地归档步骤接入。

```bash
pnpm install
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm storybook
```

打开 **View Engine → 入门与业务流程 → 最小接入 → 第一个数据视图 · 查询、排序与分页**。金额改为 `10000` 时，表格保持原结果；按 Enter 或点击查询后，只剩 `SO-202609-1001`。清空已应用条件值可恢复全部结果，再尝试分页与排序。完整组件见[可运行示例](../../examples/view-engine.md)。

## 连接四个职责

| 部分             | 提供内容                               | 负责什么                               |
| ---------------- | -------------------------------------- | -------------------------------------- |
| `ViewDefinition` | `id`、`sourceId`、`rowKey`、字段与能力 | 多个实例共用的元数据                   |
| `ViewInstance`   | 身份、范围与 `config`                  | 一份保存的筛选、列、排序和每页条数配置 |
| `ViewHost`       | 服务及 `resolveSource(sourceId)`       | 元数据、持久化、权限与本地数据源连接   |
| `useViewEngine`  | `scopeKey`、`definitionId`、host       | 创建、加载、订阅和释放引擎             |

本地元数据可通过 `definition` 和 `instances: { instances, defaultInstanceId }` 传入 `useViewEngine`。只有查询数据源也能展示页面；保存、创建、删除、排序等能力根据宿主方法和权限启用。

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { useViewEngine, ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function OrderPage({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ scopeKey, definitionId: 'orders', host });
  return <ViewPage {...binding} selectable />;
}
```

`scopeKey` 标识稳定的访问范围。用户、租户或授权范围变化时必须改变它，它不能替代服务端鉴权。引擎生命周期由 `[scopeKey, definitionId]` 决定；同一范围内更换宿主回调会保留会话。本地元数据只用于初始化该生命周期；需要重新初始化时显式更换 React key。

应用自己持有引擎时，用 `ViewPageContent` 提供视图导航，或用 `RecordView` 只展示当前数据视图。自行持有的引擎需要调用 `load()` 和 `dispose()`，不能在每次 render 时创建。参阅[引擎生命周期](../../reference/view-engine/engine.md)。

## 统一样式

导入一次已编译的 CSS 即可，消费者无需接入 Tailwind 或 React Compiler 构建插件。外层使用 `.fve-root`，通过 `data-theme="light"` / `data-theme="dark"` 指定主题；未指定时跟随继承的 `color-scheme`。参阅[组件与主题](../../reference/view-engine/components.md)。
