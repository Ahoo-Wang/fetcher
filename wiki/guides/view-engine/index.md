---
prev: false
title: View Engine tasks
description: Build a record page, configure filters and cells, and connect application-owned services.
---

# View Engine tasks

View Engine combines a React-independent engine, persisted component configuration, and React controls built with shadcn/Base UI. The implemented view kind is `record` with a table presentation. Analysis, cards and dashboards are separate work.

| Task                             | Start here                                  | Verify in Storybook                                |
| -------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Render your first page           | [Getting started](./getting-started.md)     | View Engine → 开发接入 → 最小接入 → 第一个数据视图 |
| Add local or remote filters      | [Filters](./filters.md)                     | View Engine → 专项场景 → 查询与筛选 → 内置筛选器   |
| Format cells, summarize, refresh | [Table and runtime](./table-and-runtime.md) | View Engine → 专项场景 → 数据展示 / 组件与主题     |
| Save and manage views            | [Saved views](./saved-views.md)             | View Engine → 专项场景 → 视图与运行时 → 视图管理   |
| Add business operations          | [Extensions](./extensions.md)               | View Engine → 开发接入 → 业务扩展                  |

The [complete example](../../examples/view-engine.md) is also used by Storybook. Use the [API reference](../../reference/view-engine/index.md) for contracts. `@ahoo-wang/fetcher-viewer` is the separate Ant Design package; its `ViewDefinition` and filter models are different.
