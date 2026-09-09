---
prev: false
title: View Engine tasks
description: Build a record page, configure filters and cells, and connect application-owned services.
---

# View Engine tasks

View Engine combines a React-independent engine, persisted component configuration, and React controls built with shadcn/Base UI. The implemented view kind is `record` with a table presentation. Analysis, cards and dashboards are separate work.

| Task                             | Start here                                  | Verify in Storybook                     |
| -------------------------------- | ------------------------------------------- | --------------------------------------- |
| Render your first page           | [Getting started](./getting-started.md)     | View Engine → 快速开始 → 第一个数据视图 |
| Add local or remote filters      | [Filters](./filters.md)                     | View Engine → 过滤器 → 内置组件         |
| Format cells, summarize, refresh | [Table and runtime](./table-and-runtime.md) | View Engine → 单元格 / Record View      |
| Save and manage views            | [Saved views](./saved-views.md)             | View Engine → Record View → 视图管理    |
| Add business operations          | [Extensions](./extensions.md)               | View Engine → 扩展接入 → 公共包         |

The [complete example](../../examples/view-engine.md) is also used by Storybook. Use the [API reference](../../reference/view-engine/index.md) for contracts. `@ahoo-wang/fetcher-viewer` is the separate Ant Design package; its `ViewDefinition` and filter models are different.
