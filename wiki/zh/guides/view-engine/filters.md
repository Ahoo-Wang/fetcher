---
title: 配置筛选器
description: 选择内置编辑器，保存组件配置，并显式应用查询。
---

# 配置筛选器

## 选择字段编辑器

字段定义的 `type` 和显式 `operators` 声明能力，`editor` 仅选择新建节点的默认组件。已有节点的 `component` 是实际组件引用；修改字段默认值不会替换或额外限制它。内置名称不带 `fve/` 前缀。

| 需求                           | `editor.name`         | 操作符 / 配置                           |
| ------------------------------ | --------------------- | --------------------------------------- |
| 文本、数字、布尔、普通日期输入 | `builtin` 或省略      | 根据字段类型推导，再由 `operators` 限制 |
| 本地单选                       | `select`              | EQ / NE，使用 `field.options`           |
| 本地多选                       | `multi-select`        | IN / NOT_IN，使用 `field.options`       |
| 远程单选                       | `remote-select`       | EQ / NE，配置 `options.source`          |
| 远程多选                       | `remote-multi-select` | IN / NOT_IN，配置 `options.source`      |
| 多个带类型的值                 | `text-values`         | IN / NOT_IN                             |
| 日期、日期时间区间             | `datetime-range`      | BETWEEN，可设置 `showTime`              |

候选项可设置 `group`。ID 保留原类型，`1` 与 `'1'` 不相等。字段上的 `group` 用于“添加筛选”分组，候选项上的 `group` 用于候选分组。字段 `operators: []` 表示不提供该字段的筛选能力，`definition.allowedOperators` 进一步约束整个表达式。

## 编辑、查询与保存

输入只修改草稿，点击查询或按 Enter 才应用有效输入。未设置的控件会保留，但不产生依赖值的查询条件。已应用条件的清空按钮会清空对应控件值并立即查询；编辑面板中的删除按钮则删除整个草稿控件。

简单模式每个作用域内的字段只有一个控件，支持 ELEMENT_MATCH 及嵌套数组；每个“同一元素满足”子筛选区隐含 AND。空元素作用域可继续编辑，但添加子条件前不能查询。高级模式允许同字段多条规则，并支持 AND/OR/NOR 嵌套。切换模式不会自动展开或删除已有分支。字段选择使用分组 Checkbox 弹层；逻辑组合从独立的 Button Group 菜单添加。

保存 `ViewInstance.config.filters: FilterConfiguration`，包括组件名、options、操作符和原始 `props`。不能用编译后的 Wow `FilterExpression` 替代，否则无法恢复未设置控件、所选编辑器和展示属性。组件注册负责纯 `compile` 与可选 `clear`，面板负责协调查询。参阅[筛选契约](../../reference/view-engine/filters.md)。

## 远程候选

```ts
import type { ViewFieldDefinition } from '@ahoo-wang/fetcher-view-engine';

const customerField: ViewFieldDefinition = {
  field: 'customerId',
  label: '客户',
  type: 'string',
  group: '客户信息',
  editor: {
    name: 'remote-multi-select',
    options: { source: 'customers', pageSize: 20, debounceMs: 250 },
  },
};
// ViewPage 的 extensions: { optionSources: { customers: customerOptionSource } }
```

`FilterOptionSource.search({ search, cursor, size }, signal)` 返回 `{ list, nextCursor }`；`resolve(ids, signal)` 返回 `{ list, missing }`，必须完整、唯一地覆盖每个请求 ID。访问范围内保持 source 对象稳定，并把 signal 传给 Fetcher 或后端。候选数据通过 `extensions.optionSources` 注入，与 ViewHost 解析的记录查询数据源分离。保存的是组件配置，不包含数据源函数或搜索缓存。

## 日期粒度与时区

日期/日期时间区间默认使用双月 Date Range Picker。datetime 字段只显示日期时，会查询完整自然日，包含结束日及其实际夏令时边界。设置 `editor.options.showTime: true` 后，在组合弹层编辑起止日期与精确到秒的时间；确定后回填，取消/Escape 放弃弹层草稿。

时区统一设置在 `ViewDefinition.timeZone`，例如 `Asia/Shanghai`；省略时使用运行环境本地时区。独立 `FilterPanel` 直接接收 `timeZone`，字段不覆盖全局设置。查询使用毫秒时间戳，组件配置保留可编辑的日期时间值。

在 **View Engine → 查询与筛选 → 内置筛选器** 验证远程分页、重试与恢复，在 **扩展与组件 → 日期时间** 验证独立日期控件。
