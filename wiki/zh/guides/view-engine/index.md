---
prev: false
title: View Engine 数据视图
description: 接入数据视图，配置筛选与单元格，并连接应用自己的服务。
---

# View Engine 数据视图

View Engine 由不依赖 React 的引擎、可保存的组件配置和基于 shadcn/Base UI 的 React 组件组成。当前实现 `record` 数据视图与表格展示；分析、卡片和仪表板属于后续工作。

| 任务                   | 阅读入口                               | Storybook 验证位置                                       |
| ---------------------- | -------------------------------------- | -------------------------------------------------------- |
| 展示第一个页面         | [快速接入](./getting-started.md)       | View Engine → 入门与业务流程 → 最小接入 → 第一个数据视图 |
| 配置本地、远程筛选     | [筛选器](./filters.md)                 | View Engine → 查询与筛选 → 内置筛选器                    |
| 渲染单元格、汇总与刷新 | [表格与运行时](./table-and-runtime.md) | View Engine → 数据视图 / 扩展与组件                      |
| 保存与管理视图         | [保存视图](./saved-views.md)           | View Engine → 引擎与宿主 → 视图管理                      |
| 添加业务操作           | [扩展接入](./extensions.md)            | View Engine → 扩展与组件 → 业务扩展                      |

[完整示例](../../examples/view-engine.md)与 Storybook 共用源码，接口细节见 [API 参考](../../reference/view-engine/index.md)。`@ahoo-wang/fetcher-viewer` 是独立的 Ant Design 包，其 `ViewDefinition` 和过滤器模型与本包不同。
