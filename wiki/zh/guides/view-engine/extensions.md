---
next: false
title: 接入业务扩展
description: 注册全局操作、批处理、行操作、筛选与单元格扩展，并明确职责。
---

# 接入业务扩展

## 五类扩展入口

| 需求               | 注册位置                   | 配置引用                                          |
| ------------------ | -------------------------- | ------------------------------------------------- |
| 全局业务操作       | `extensions.globalActions` | `definition.recordActions.global`                 |
| 批处理 / 表格操作  | `extensions.tableActions`  | `definition.recordActions.table`                  |
| 单行操作           | `extensions.rowActions`    | `definition.recordActions.row`，并提供 actions 列 |
| 筛选组件与编译逻辑 | `extensions.filters`       | 字段、操作符或组件配置的编辑器引用                |
| 自定义单元格       | `extensions.cells`         | `field.cellRenderer` 或 `column.renderer`         |

引用统一为 `{ name, options? }`，options 只能包含 JSON 数据。组件、服务客户端和回调注册在运行时 extensions 中，不写入保存的 JSON。未知名称和无效配置会显式报错，不会静默换成其他组件。优先使用已有内置组件。

```ts
// 右侧组件和注册由业务应用提供。
const extensions = {
  globalActions: { 'create-order': CreateOrder },
  tableActions: { 'process-orders': ProcessSelectedOrders },
  rowActions: { 'process-order': ProcessOrder },
  cells: { 'customer-link': CustomerLink },
  filters: { 'order-status': orderStatusFilter },
};
```

## 业务操作

操作组件收到只读 definition/instance、已应用 `filter`、`sort`、options，以及绑定到该实例的 `refresh()`。全局/表格操作还收到 `selectedRowKeys` 和 `querying`，行操作收到 `record`、`rowKey`。已应用 filter 为 null 表示查询范围不可用，不能据此发起面向整个筛选范围的写入。

业务应用负责执行写入、处理错误和防止重复提交。写入成功后刷新绑定实例；如果写入已成功而刷新失败，只重试刷新，不能重复写入。业务操作期间禁用或暂停冲突工作，并传入 `autoRefreshPaused`。单元格渲染器只接收展示上下文，不能在 render 中发起写入。

## 筛选扩展

一份 `FilterRegistration` 同时提供 `component`、纯 `compile(props, context)`、必填的支持 `modes`，以及可选 `supports` / `clear`。默认 `render: 'value'` 让编辑器复用标准字段、操作符和删除框架；`render: 'filter'` 接收完整控件契约，包括标签、操作符变更、清空与移除。

`onChange` 发布可序列化的原始 props，不直接查询。不完整的本地输入必须通过 `onValidityChange(false, message)` 报告。未设置时 compile 返回 `undefined`，非空非法输入抛出错误。clear 应保留无关展示属性。注册定义在引擎生命周期内保持稳定，保存属性语义发生不兼容变化时应使用新的组件名。

完整实现在 **View Engine → 扩展接入 → 公共包**。`packages/view-engine/examples/react/OrderExtensions.tsx` 实现五类扩展，`OrderOperations.tsx` 协调业务写入与刷新。代码面板展示真实源码，回归场景验证写入、失败恢复和 JSON 还原。接口细节见[筛选契约](../../reference/view-engine/filters.md)与[组件参考](../../reference/view-engine/components.md)。
