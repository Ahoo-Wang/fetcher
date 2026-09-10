---
title: 过滤展示数据
description: 连接可用过滤器、已保存过滤配置和应用查询计算逻辑。
---

# 过滤展示数据

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

## 前提

运行[本地 Viewer 示例](../../examples/viewer.md)。它提供 Active 布尔过滤器与刻意限制范围的本地计算器。没有扩展计算逻辑或改用兼容服务端之前，不要给界面添加未支持的操作符。

## 连接三类过滤输入

查看 `LocalViewer.tsx` 的 `definition.availableFilters`、`initialView.filters` 和 `filterUsers`。定义在 User 分组提供组件为 `bool` 的过滤器。视图加入 type 为 `bool`、字段为 `active` 的 Active 过滤器。计算器仅接受 ALL，以及该字段的 TRUE/FALSE，拒绝其他条件。

注册的控件负责构造条件，不会自己搜索传入的行。`onLoadData` 收到条件后由应用执行。示例计数回调也调用 `filterUsers`，因此计数和行使用相同的已支持语义。

## 应用并验证条件

1. 从四个用户、无排序开始，在 **Active** 选择**是**，点击**搜索**。
2. 匹配行为 Ada、Grace，总数为二。若已开启 Name 降序，则顺序为 Grace、Ada。
3. 选择**否**再搜索，匹配 Lin、Zoe，顺序由当前排序决定。
4. 选择**未设置**再搜索，恢复所有用户。未设置表示移除过滤，不是 `active === false`。

添加新字段时，定义字段元数据和支持的过滤器入口，在视图中加入所需控件，并实现该控件实际发出的条件操作符。开发期间通过回调检查真实条件值。内建日期时间选择通过 `datetime` 注册表解析；`DateTimeFilter` 不是根入口具名导出。

## 失败与清理

不支持的条件故意显示 alert 并清空数据，不会默默按全部匹配处理。不要将本地计算器用作通用 Wow DSL 引擎。远端服务需要校验字段和操作符，并在服务端执行授权；客户端条件不是访问控制。没有后端 count 端点时保持铃铛监控关闭。本地过滤无需手动清理订阅，外部请求与监听器由应用负责。

继续阅读[将过滤保存到视图](./saved-views.md)、[过滤参考](../../reference/viewer/filters.md)与[集成边界](../../architecture/integration-decisions.md)。
