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

`field` 和 `rowKey` 都相对于每条返回记录，例如 `customer.name`、`items.0.sku`、`meta.id`。返回对象的属性名不能包含点号；字段路径中的点号只作为导航分隔符，也支持数组下标。每一段只读取自有属性。表格不会自动加 `state.` 等后端前缀；应按实际响应结构配置路径，并独立确认后端支持对应查询字段。

## 列与选择

列身份、显隐、顺序、宽度、固定位置和汇总选择保存在 `presentation.table.columns`。主键固定左侧，操作列固定右侧。列宽通过拖动表格边界调整，列设置中没有数值宽度输入。普通列只能沿连续固定列的相邻位置固定，固定边缘显示阴影。

设置 `selectable` 开启选择。批处理收到的是当前已加载页的选中键，不代表整个查询匹配集。行键必须是唯一的字符串或有限数字；缺失、重复或无效键属于数据错误。

页码分页查询返回的总数若已不足以覆盖当前页，引擎会清空该页并重新查询第一页。纠正查询失败时保留查询错误，重试仍查询第一页；期间发起的新导航或查询优先。游标分页继续使用独立的游标协议。

## 汇总范围与失败

数字列可多选 SUM/AVG/MIN/MAX，并受 `summaryFunctions` 限制。“本页”汇总已加载记录，“所有”基于已应用筛选调用数据源可选的 `aggregate()`。选中行不会改变汇总范围。每个范围只在标签旁显示一个错误入口，展开可查看原因并重试；`refreshSummary()` 不会重新查询记录。缺失数字保持占位，不虚构为零。

## 全局运行时工具

手动刷新、自动刷新与页面展开放在顶部全局工具栏。自动刷新提供 30 秒、1 分钟、5 分钟和倒计时，不会修改已保存的查询配置。业务写入期间可传入 `autoRefreshPaused`；页面不可见或已有工作时，运行时会阻止重叠的自动查询。

展开覆盖页面区域，Escape 退出，不调用浏览器原生 Fullscreen API。查询、汇总和操作错误各自保留对应恢复入口。后台刷新期间保留最近一次成功记录，首次加载使用 Spin，空结果使用图标。

在 **Record View → 表格与汇总 / 运行时工具 / 布局与主题** 和 **单元格 → 内置组件** 验证。属性细节见[组件参考](../../reference/view-engine/components.md)。

## 卡片布局与默认配置

通过 `ViewDefinition.record.defaultPresentation.card` 预设标题、可选封面、摘要字段和行操作，通过 `record.defaultPresentation.table` 预设表格列。本地定义和远程 JSON 使用同一契约。实例已有配置优先，切换布局不覆盖设置，也不重新查询记录。

```ts
const defaultPresentation = {
  card: {
    title: { id: 'title', field: 'id' },
    fields: [
      { id: 'amount', field: 'amount', renderer: { name: 'number' } },
      { id: 'status', field: 'status' },
    ],
  },
};
```

将该对象放入声明了对应字段的定义。构造实例时调用 `resolveRecordPresentation(definition, 'card')`，或使用内置“表格／卡片”切换按钮。仅当前布局配置必填。`engine.record(id).setLayout('card')` 切到卡片，`engine.record(id).setCardConfig(config)` 修改卡片设置。切换回来恢复该模式上次已应用的配置，包括尚未保存的修改。保存同时保留布局及已配置的两种展示，重载不重新套预设。

卡片设置使用本地草稿；应用更新实例，取消丢弃草稿。行操作使用 `actions: { renderer: { name: 'custom' } }`，或 `{}` 继承 `definition.record.recordActions.row`。隐藏只设置 `visible: false`，保留渲染器以便重新开启。预设只含 JSON 引用，实际组件仍注册到 `extensions.cells` / `rowActions`。

标题缺失时回退记录主键，0 和 false 是有效值。封面必须引用 string 字段，值为 http/https 或相对图片地址；地址无效或图片加载失败时显示占位。卡片与表格共用本页选择。卡片不执行汇总，返回表格按配置重新计算汇总，不重新查询记录。

`ViewDefinition.record.allowedLayouts` 为必填的非空、不重复数组：`['table']`、`['card']` 或同时开启。仅允许一种布局时，顶部不显示切换入口；引擎和实例加载均拒绝未允许的活动布局。切换保留各模式配置。卡片使用右上角选择按钮（`aria-pressed`），不占独立行；自定义内容应避让该角标。顶部通用操作使用图标及提示，菜单保留文字。

共享记录工具栏提供排序入口，以规则列表从上到下确定优先级，支持拖动/键盘调整、添加、移除和清除全部；与表头使用同一个 `instance.config.sort`，仅允许 Card 时仍可使用。同一分页查询的手动刷新保留已有记录，避免卸载行操作；筛选、排序、翻页和游标刷新仍重新加载。
