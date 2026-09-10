---
prev: false
title: 'Viewer 参考'
description: 'Viewer 入口选择、安装与行为契约'
---

# Viewer

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../../guides/view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

Viewer 提供 Ant Design 过滤、表格和保存视图 UI。先根据谁拥有行数据和保存视图选择组件。本地表格不要求 Wow 后端；FetcherViewer 要求既定的远端协议。

## 选择入口

| 入口                                                | 组件负责                              | 应用负责                                                     |
| --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| [View](./view-and-viewer#api-View)                  | 单视图过滤/表格/分页交互              | `dataSource: {list,total}`、数据加载和持久化                 |
| [Viewer](./view-and-viewer#api-Viewer)              | 视图集合、切换和活动视图编辑状态      | `definition`、初始视图、`onLoadData`、增改删持久化及成功回调 |
| [FetcherViewer](./fetcher-viewer#api-FetcherViewer) | 定义/视图读取、Wow 命令与分页数据请求 | 兼容后端、默认 Fetcher/认证、租户/所有者身份和授权           |

`View` 与 `Viewer` 不替你过滤或分页输入数组；回调请求新数据，应用提供结果行与总数。保存成功回调确认的是应用的持久化。FetcherViewer 为**创建/更新**增加版本确认；删除和普通行查询有不同边界。

## 完整安装前提

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-cosec @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventbus @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-openapi @ahoo-wang/fetcher-react @ahoo-wang/fetcher-storage @ahoo-wang/fetcher-viewer @ahoo-wang/fetcher-wow @ant-design/icons antd dayjs react react-dom
```

本参考针对 5.0.0。库包声明 Node >=18.20.8；仓库开发要求 Node >=20.20.2、pnpm 10.34.5。命令包含递归内部 peer，包括经 Wow/React/CoSec 引入的包；直接运行依赖自动安装。 外部 peer 范围为 React/ReactDOM ^19.2.8、antd ^6.6.3、@ant-design/icons ^6.3.4、dayjs ^1.11.23；即使不使用某项功能，仍是安装前提。消费者无需复制仓库的 React Compiler 工具链。

## 可运行核心示例

运行步骤、服务夹具与预期结果见[接入指南](../../guides/viewer/index.md).

<<< @/../stories/docs/LocalViewer.tsx

## 专题

- [View 与 Viewer 组合](./view-and-viewer)
- [模型与状态所有权](./models-and-state)
- [过滤器与可编辑面板](./filters)
- [表格、列与单元格](./tables-and-cells)
- [已保存视图面板与持久化回调](./saved-views)
- [FetcherViewer 远端集成](./fetcher-viewer)
- [注册表、输入与全屏按钮](./registries-and-inputs)
- [工具栏、刷新与本地化](./toolbar-and-locale)
- [完整符号索引](./symbols)

[状态与资源所有权](../../architecture/state-and-resources) · [失败与取消边界](../../architecture/failure-model)
