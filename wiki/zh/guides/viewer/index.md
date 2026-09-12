---
prev: false
title: 数据视图任务
description: 按前提选择数据视图任务的具体任务。
---

# 数据视图任务

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

在具备 Viewer peer 依赖的 React 应用中从本地数据开始。View 展示单个视图；Viewer 还管理视图集合。数据适配层执行查询，持久化归应用所有。

- [渲染本地行](./local-data.md)
- [执行分页与排序](./pagination-and-sorting.md)
- [过滤展示数据](./filters.md)
- [保存视图状态](./saved-views.md)
- [连接远端数据](./remote-data.md)

[全部指南](../index.md) · [集成决策](../../architecture/integration-decisions.md)
