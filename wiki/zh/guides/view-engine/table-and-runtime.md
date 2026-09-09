---
title: 表格与运行时操作
description: 配置内置单元格、列布局、汇总、刷新与页面展开。
---

# 表格与运行时操作

## 在字段或列上配置单元格

`field.cellRenderer` 提供默认渲染，`column.renderer` 可在某个实例中覆盖。内置名称为 `text`、`tags`、`status`、`link`、`date-time`、`number`，也可以直接组合对应的独立 React 组件。

```ts
import type {
  RecordColumn,
  ViewFieldDefinition,
} from '@ahoo-wang/fetcher-view-engine';

const amount: ViewFieldDefinition = {
  field: 'amount',
  label: '金额',
  type: 'number',
  sortable: true,
  cellRenderer: { name: 'number' },
  numberFormat: { style: 'currency', currency: 'CNY' },
  summaryFunctions: ['SUM', 'AVG'],
};
const column: RecordColumn = {
  id: 'amount',
  kind: 'field',
  field: 'amount',
  summary: ['SUM', 'AVG'],
};
```

数字格式由单元格与汇总共用，计算保留原始数值。文本复制使用原始值，即使界面显示枚举标签或省略号；成功提示在 2 秒后恢复。危险链接协议呈现为文本，新标签页链接带有 `noopener noreferrer`。

`field` 和 `rowKey` 都相对于每条返回记录，例如 `customer.name`、`items.0.sku`、`meta.id`。若记录具有字面名称为 `customer.name` 的自有属性，优先读取该属性。表格不会自动加 `state.` 等后端前缀；应按实际响应结构配置路径，并独立确认后端支持对应查询字段。

## 列与选择

列身份、显隐、顺序、宽度、固定位置和汇总选择保存在 `presentation.table.columns`。主键固定左侧，操作列固定右侧。列宽通过拖动表格边界调整，列设置中没有数值宽度输入。普通列只能沿连续固定列的相邻位置固定，固定边缘显示阴影。

设置 `selectable` 开启选择。批处理收到的是当前已加载页的选中键，不代表整个查询匹配集。行键必须是唯一的字符串或有限数字；缺失、重复或无效键属于数据错误。

## 汇总范围与失败

数字列可多选 SUM/AVG/MIN/MAX，并受 `summaryFunctions` 限制。“本页”汇总已加载记录，“所有”基于已应用筛选调用数据源可选的 `aggregate()`。选中行不会改变汇总范围。每个范围只在标签旁显示一个错误入口，展开可查看原因并重试；`refreshSummary()` 不会重新查询记录。缺失数字保持占位，不虚构为零。

## 全局运行时工具

手动刷新、自动刷新与页面展开放在顶部全局工具栏。自动刷新提供 30 秒、1 分钟、5 分钟和倒计时，不会修改已保存的查询配置。业务写入期间可传入 `autoRefreshPaused`；页面不可见或已有工作时，运行时会阻止重叠的自动查询。

展开覆盖页面区域，Escape 退出，不调用浏览器原生 Fullscreen API。查询、汇总和操作错误各自保留对应恢复入口。后台刷新期间保留最近一次成功记录，首次加载使用 Spin，空结果使用图标。

在 **Record View → 表格与汇总 / 运行时工具 / 布局与主题** 和 **单元格 → 内置组件** 验证。属性细节见[组件参考](../../reference/view-engine/components.md)。
