---
prev: false
title: 数据视图任务
description: 按前提选择数据视图任务的具体任务。
---

# 数据视图任务

::: warning 仅适用于 5.x（已冻结）
本页只适用于 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)）。`@ahoo-wang/fetcher-viewer` 冻结在该线上：仅维护现有功能，不再新增功能。接替它的是 Wow 仓库的 `@ahoo-wang/wow-view-engine`（[`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)，[wow.ahoo.me](https://wow.ahoo.me)），尚未发布。两者模型与 API 不同，迁移需要适配。
:::

在具备 Viewer peer 依赖的 React 应用中从本地数据开始。View 展示单个视图；Viewer 还管理视图集合。数据适配层执行查询，持久化归应用所有。

- [渲染本地行](./local-data.md)
- [执行分页与排序](./pagination-and-sorting.md)
- [过滤展示数据](./filters.md)
- [保存视图状态](./saved-views.md)
- [连接远端数据](./remote-data.md)

[全部指南](../index.md) · [集成决策](../../architecture/integration-decisions.md)
