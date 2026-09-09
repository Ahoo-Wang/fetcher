---
title: React 组件与主题
description: 选择合适的所有权层级，配置控件、单元格与操作属性。
---

# React 组件与主题

## 页面与表格

| 组件                   | 必填输入                                                             | 所有权                                             |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| `ViewPage`             | scopeKey、definitionId、host                                         | 创建、加载、释放引擎，可直接提供本地定义和实例列表 |
| `ViewPageContent`      | engine                                                               | 展示视图导航和数据页，引擎由调用方拥有             |
| `RecordView`           | engine                                                               | 展示当前数据会话，引擎由调用方拥有                 |
| `RecordTable`          | definition、instance、appliedFilter、rows、选择/列/排序回调、refresh | 受控表格，请求和状态由调用方拥有                   |
| `RecordColumnSettings` | definition、columns、onChange                                        | 受控列配置                                         |

ViewPage/RecordView 支持 `extensions`、`filterContext`、`selectable`（默认 false）、`autoRefreshPaused`（默认 false）、`className`。ViewPage 还有 `initialSidebarCollapsed`，RecordView 有 `toolbarStart`。RecordTable 单独接收查询/汇总状态与重试回调。

## 内置单元格属性

独立单元格均支持 className。配置中的 renderer options 有意小于独立组件的完整 props。

| 组件 / 配置名称              | 主要属性或 options                                        | 默认值 / 行为                                                                     |
| ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `TextCell` / `text`          | value、text、ellipsis、copyable                           | ellipsis/copyable 默认 false；text 只改展示，复制原始值                           |
| `TagsCell` / `tags`          | value、options、maxVisible                                | maxVisible 默认 2，按类型去重，剩余标签在弹层展开                                 |
| `StatusCell` / `status`      | value、options、tones                                     | neutral/success/warning/danger/info，未知值仍可读                                 |
| `LinkCell` / `link`          | value、text、href、newTab；renderer 使用 hrefField/newTab | newTab 默认 false，校验安全 URL                                                   |
| `DateTimeCell` / `date-time` | value、type、timeZone、locale、dateStyle、timeStyle       | type 默认 datetime，locale 默认 zh-CN，日期/时间默认 medium，视图渲染使用全局时区 |
| `NumberCell` / `number`      | value、format                                             | renderer 使用 field.numberFormat，空或无效数字显示占位                            |

配置中的渲染器名是 **`date-time`**，字段类型是 **`datetime`**。金额/百分比通过 `field.numberFormat` 设置 Intl 格式，不要往 number renderer 的 options 放独立 format 对象。tags/status 的值标签来自 field.options。

纯 YYYY-MM-DD 字符串保留日期展示语义；时间戳按选定时区格式化，缺失或无效日期显示占位。

## 独立筛选控件

`FieldFilter` 组合字段标签、操作符、children 和可选删除回调，不执行查询。`FilterSelect` / `FilterSearchSelect` 提供受控字符串值、options、label、onValueChange 和可选 onClear；SearchSelect 增加候选搜索。`FilterMultiSelect` 处理带类型的多选 ID，`FilterTextValues` 保留带类型的输入项。需要配置所有权和校验时使用 FilterPanel。

`FilterRemoteSelect` 接收 source/label，以及单个 value 或 `multiple: true` 配合 values；变更回调还返回选中候选。selectedOptions 提供保存标签，debounce 默认 300 ms，pageSize 使用 Wow DEFAULT_CURSOR_SIZE 并受 MAX_CURSOR_SIZE 限制。无效分页大小或防抖值会抛错，更换 source 对象会创建新候选会话。

`FilterDatePicker` 使用 `Date | undefined`；`FilterTimeInput` 保留不完整文本并提供时/分/秒选择。`FilterDateTimeRange` 接收 field/value/onValueChange，以及可选 showTime/timeZone/有效性属性。日期范围使用双月，datetime 开启 showTime 后使用日期时间组合弹层和显式确定。独立控件本身不保存或应用查询。

## 扩展上下文

`GlobalActionsRendererProps` / `TableActionsRendererProps` 提供 definition/instance/filter/sort/options/refresh、selectedRowKeys、querying。`RowActionsRendererProps` 在通用操作上下文上增加 record/rowKey。`CellRendererProps` 包含 value/record/rowKey/index/field/column/definition/instance/options。输入不可变，修改时构造新值。单元格 props 不提供业务命令 API。

## 主题与可访问性

编译样式采用 `.fve-root`、`fve:` 工具类和 `--fve-*` 变量。显式 data-theme 支持 light/dark，否则跟随继承的 color-scheme。弹层从触发控件复制当前 token、字体和色彩模式，适应裁切和滚动容器。自定义控件需要保留标签、错误关联与键盘语义。

公开组合原语包括 Button、Calendar、Popover/PopoverContent/PopoverTitle/PopoverTrigger，以及[符号索引](./symbols.md)中的 Select、InputGroup 家族。内部 DropdownMenu、Dialog 等私有文件不是额外受支持的包导入路径。
