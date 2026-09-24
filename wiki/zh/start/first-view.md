---
title: 第一个数据视图
description: 在 5.x 线上用 Ant Design Viewer 搭建本地表格；后继位于 Wow 仓库。
---

# 第一个数据视图

::: warning 仅适用于 5.x（已冻结）
本页只适用于 5.x 线（npm 5.1.x，分支 [`5.x`](https://github.com/Ahoo-Wang/fetcher/tree/5.x)）。`@ahoo-wang/fetcher-viewer` 冻结在该线上：仅维护现有功能，不再新增功能。接替它的是 Wow 仓库的 `@ahoo-wang/wow-view-engine`（[`typescript/`](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)，[wow.ahoo.me](https://wow.ahoo.me)），尚未发布。两者模型与 API 不同，迁移需要适配。
:::

Fetcher main 不提供数据视图组件。在 Wow 视图引擎发布之前，存量项目用下面的 5.x Ant Design Viewer 搭建表格；新表格也可以把 [React 请求状态](../guides/react/index.md)与应用已在使用的表格组件组合起来。

## Ant Design Viewer 路径

从[完整的本地 Viewer 示例](../examples/viewer)开始。该页提供消费者安装命令、一个完整组件、React 入口和运行命令，无需服务端、认证设置或 Storybook fixture。

按示例的五步操作：查看首屏、切页、按 Name 排序、按 Active 过滤，然后保存并切换视图。行数据会变化，是因为示例应用计算了数据并传给 Viewer。

| 内容                         | 归属                    |
| ---------------------------- | ----------------------- |
| 字段和可用过滤器             | 应用的 `ViewDefinition` |
| 页码、条件、排序交互         | Viewer 回调应用         |
| 过滤、排序、分页后的行与总数 | 应用的本地计算          |
| 已保存设置及成功回调         | 应用的内存状态          |
| 永久存储与访问控制           | 你的应用和后端          |

在 `5.x` 分支上使用示例页的 Storybook 入口和浏览器命令验证同一行为。该示例是本页唯一的可执行来源；刷新会丢失已保存视图。可选的服务端数据监控不在此本地示例范围内。

单张表格可能只需要 `View`。需要管理多个视图，并由应用加载和保存时，使用 `Viewer`。只有服务端实现预期协议时才考虑 `FetcherViewer`，参见 [FetcherViewer 参考](../reference/viewer/fetcher-viewer.md)。
