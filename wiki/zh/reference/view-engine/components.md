---
title: React 组件与主题
description: 选择合适的所有权层级，配置控件、单元格与操作属性。
---

# React 组件与主题

## 页面与表格

| 组件                   | 必填输入                                                             | 所有权                                 |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| `ViewPage`             | engine 或 hook binding                                               | 纯 UI，不持有引擎生命周期              |
| `ViewPageContent`      | engine                                                               | 展示视图导航和数据页，引擎由调用方拥有 |
| `RecordView`           | engine                                                               | 展示当前数据会话，引擎由调用方拥有     |
| `RecordTable`          | definition、instance、appliedFilter、rows、选择/列/排序回调、refresh | 受控表格，请求和状态由调用方拥有       |
| `RecordColumnSettings` | definition、columns、onChange                                        | 受控列配置                             |

ViewPage/RecordView 支持 `extensions`、`filterContext`、`selectable`（默认 false）、`autoRefreshPaused`（默认 false）、`className`。ViewPage 还有 `initialSidebarCollapsed`，RecordView 有 `toolbarStart`。RecordTable 单独接收查询/汇总状态与重试回调。

仅当 `getCapabilitiesSnapshot().setDefault` 为 true 时，视图管理器才显示“设为默认/取消默认”操作。标记读取 `state.defaultInstanceId`；修改默认项不会离开当前选中视图。

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

`GlobalActionsRendererProps` / `ToolbarActionsRendererProps` 提供 definition/instance/filter/sort/options/refresh、selectedRowKeys、querying。`RowActionsRendererProps` 在通用操作上下文上增加 record/rowKey。`CellRendererProps` 包含 value/record/rowKey/index/field/column/definition/instance/options。输入不可变，修改时构造新值。单元格 props 不提供业务命令 API。

在 `RecordView` 中，数据渲染器接收结果实际执行的查询配置，以及当前表格／卡片展示设置。编辑尚未查询的筛选不会改变已展示数据的查询口径。

## 主题与可访问性

编译样式采用 `.fve-root`、`fve:` 工具类和 `--fve-*` 变量。显式 data-theme 支持 light/dark，否则跟随继承的 color-scheme。弹层从触发控件复制当前 token、字体和色彩模式，适应裁切和滚动容器。自定义控件需要保留标签、错误关联与键盘语义。

公开组合原语包括 Button、Calendar、Popover/PopoverContent/PopoverTitle/PopoverTrigger，以及[符号索引](./symbols.md)中的 Select、InputGroup 家族。内部 DropdownMenu、Dialog 等私有文件不是额外受支持的包导入路径。

## 纯分析编译

核心入口导出 `compileAnalysis(config, context)`、`validateAnalysisResult(rows, plan)`、`analysisRowKey(row, dimensions)` 及分析模型类型。这些函数不渲染 React，也不发请求。下面的示例编译 COUNT + SUM 并校验给定回包，不依赖分析页面或引擎集成。

```ts
import { AggregationFunction, FilterOperator } from '@ahoo-wang/fetcher-wow';
import {
  compileAnalysis,
  createFilterConfiguration,
  newFilterNode,
  validateAnalysisResult,
  type AnalysisCompileContext,
  type AnalysisViewConfig,
} from '@ahoo-wang/fetcher-view-engine';

const context: AnalysisCompileContext = {
  fields: [{ field: 'amount', label: 'Amount', type: 'number' }],
  capability: {
    count: true,
    fields: [
      { field: 'amount', groups: [], functions: [AggregationFunction.SUM] },
    ],
  },
};
const config: AnalysisViewConfig = {
  filters: createFilterConfiguration(newFilterNode(FilterOperator.MATCH_ALL)),
  dimensions: [],
  metrics: [
    {
      id: 'count',
      component: { name: 'count' },
      alias: 'orders',
      title: 'Orders',
      props: {},
    },
    {
      id: 'sum',
      component: { name: 'numeric' },
      field: 'amount',
      alias: 'revenue',
      title: 'Revenue',
      props: { function: AggregationFunction.SUM },
    },
  ],
  sort: [],
  limit: 100,
  presentation: {
    layout: 'table',
    columns: [{ alias: 'orders' }, { alias: 'revenue' }],
  },
};
const compiled = compileAnalysis(config, context);
if (!compiled.plan)
  throw new Error(compiled.errors.map(error => error.message).join('; '));
const result = validateAnalysisResult(
  [{ orders: 2, revenue: 125 }],
  compiled.plan,
);
if (!result.rows)
  throw new Error(result.errors.map(error => error.message).join('; '));
console.log(compiled.plan.query, result.rows);
```

`AnalysisViewConfig` 保存 `filters`、`dimensions`、`metrics`、基于 alias 的 `sort`、`limit`、可选 Elements `scope` 与 `presentation`。每个组件都有稳定的 `id`、可持久化的 `component` 引用、可选 `field`、输出 `alias`、展示 `title` 和原始 JSON `props`。不完整文本可以保留在配置中，但编译会返回错误，不产生可执行计划。

`AnalysisCompileContext` 提供筛选 `fields`、明确的 `capability`，以及可选 `timeZone`、`allowedOperators`、`filterCompilers` 和自定义分析 `compilers`。能力分别授权 COUNT、字段分组、数值函数和时间粒度。内置组件为 `terms`、`histogram`（`props.interval`）、`date-histogram`（`props.unit`）、`count`、`any`、`numeric`（`props.function`）。日期分组必须明确时区。自定义 `AnalysisCompiler.compile` 返回单个分组或指标，核心校验其字段、alias 和能力后才接受。

`compileAnalysis` 返回 `{ plan?, errors }`；成功的 `AnalysisPlan` 包含 Wow `query`、匹配的 `schema` 和可选 `timeZone`。排序中未指定的分组 alias 会追加为升序，确保顺序稳定。默认上限为 32 个分组、64 个指标、32 个有效排序项和 10,000 行，能力限制可以进一步收紧。至少需要一个指标。不分组的分析不支持排序，结果最多一行。

`validateAnalysisResult` 返回 `{ rows?, errors }`，遇到缺失 alias、类型无效、超量行或重复的带类型维度组合时拒绝整批结果。alias 按字面自有键读取，只保留 schema 中的列；仅可空列接受 null，COUNT 必须是非负安全整数，日期分桶值为 epoch 毫秒。对已校验行调用 `analysisRowKey(row, plan.schema.filter(column => column.role === 'dimension'))`，可获得带类型的维度身份。

### 多值文本缓冲

`FilterTextValues` 接收 `value?: readonly string[]`、可选受控 `rawText?: string`、报告原始键入的 `onRawTextChange?(text)` 和 `onValueChange(values, rawText)`。未提供 rawText 时由组件保存本地输入缓冲。回车或粘贴确认时，通过一次回调返回新值集合和空缓冲；移除标签时返回剩余值及当前缓冲。受控调用方应在该回调中同时更新 values 和 rawText。输入法确认不会提交值或发起查询。

注册的 `text-values` 编辑器将每次原始编辑保存到 `props.rawText`，未确认输入可跨实例切换恢复。去除首尾空白后非空的 rawText 阻止纯编译，非字符串 rawText 无效。确认会移除 rawText 并保留已确认值；清空同时移除 values 和 rawText。仅空白输入不产生未确认值。独立控件仍可使用可选 `onValidityChange(valid, message?)`，注册组件的有效性由编译结果决定。

## 引擎绑定与分析 UI

在组件中调用 `useViewEngine({ scopeKey, definitionId, host, definition?, instances?, extensions?, limits?, onDiagnostic? })`，再渲染 `<ViewPage {...binding} />`。hook 返回 `{ engine: ViewEngine | null, extensions?, error? }`。筛选与分析注册在同一生命周期内成对冻结，单元格/动作回调可以在同范围更新。`AnalysisView` 接收 engine、extensions、filterContext、toolbarStart、可选受控 configurationOpen/onConfigurationOpenChange、className。`AnalysisEditor` 与 `AnalysisTable` 是受控组合界面。`AnalysisExtensions.analysis` 按名称映射成对的 `AnalysisRegistration` 编辑器与编译器。

`AnalysisEditor` 接收 value、context、onChange 与可选 disabled、errors、extensions。`AnalysisTable` 接收 plan、已校验 rows、基于 alias 的 sort，以及可选 onSortChange、receivedAt、stale、querying；schema 必须属于当前展示结果，不能取最新工作配置的 schema。

### Elements 范围与数值表达式

`AnalysisCapability.scopes` 保存宿主授权的 `AnalysisScopeDefinition`：`{ id, label, elements: [{ path, fields }], fields, capability }`。`AnalysisViewConfig.scope` 通过 `{ id, filters }` 选择范围，每层元素必须对应一个 `FilterConfiguration`。每层 path 相对上一层范围，过滤字段相对当前元素；最终分组和指标使用该范围的 fields 与 capability。根 `config.filters` 始终使用原始根字段。元素链最多八层。`analysisScopeContext(config, context)` 返回选中范围的字段和能力上下文；范围 ID 未授权或重复时抛错。编辑器切换范围会保留已有查询草稿，供用户检查修复。

`capability.expressions: true` 授权数值指标使用显式 `component.expression`，此模式应省略 `component.field`。`AnalysisNumericExpression` 使用 Wow 枚举构造 `FIELD`（field）、`CONSTANT`（`value: number | string`）、`BINARY`（operator、left、right）树，运算符为 ADD、SUBTRACT、MULTIPLY、DIVIDE。`compileAnalysisExpression(expression, function, context)` 检查常量有限、每个数值字段与函数已授权、深度不超过 8、节点不超过 256。`1e` 等未完成文本可以保留在草稿中，但不能运行。普通字段模式仍使用 field 与 props.function；histogram 桶宽也保留原始编辑文本。

`any` 组件要求标量 field 且 `capability.fields[].any: true`。它返回代表值，不能作为稳定分组键或图表数值指标。`AnalysisResultColumn.aggregation` 保存 COUNT、SUM、AVG、MIN、MAX、ANY 语义；维度的 group 元数据包含类型及适用的 interval、unit、timeZone。

### Wow Schema 映射

`adaptWowAnalysisSchema(schema, options?)` 是返回 `{ model, fields, capability }` 的纯适配器，不读取网络或创建客户端。`WowAnalysisSchemaOptions` 提供以绝对逻辑字段路径为键的 labels 与 units。把返回的 fields/capability 放入定义，再由宿主使用现有 Snapshot/EventStream 查询客户端提供聚合数据源，并传递取消信号。

仅发布 `masked === false` 且显式能力受支持的节点，保守映射标量数值、字符串和布尔字段。时间字段必须为 `TEMPORAL_EPOCH` 且单位为 `MILLISECONDS`，其他时间编码、联合类型和未知类型均省略。带 ELEMENT_SCOPE 的对象数组会生成预定义相对范围链；不会把根数组展平成标量聚合字段，标量数组也省略。ANY 要求标量字段具备 AGGREGATE_TERMS。筛选操作仅映射受支持的 PRESENCE、EXACT_MATCH、RANGE、LITERAL_MATCH 契约；仅全文检索字段不发布。标量 enumValues 数组仅在全部成员匹配字段类型时转为字段 options，保留原始字符串/数字/布尔值，以 String(value) 生成标签；含 null 或混合类型的列表整体省略。宿主可翻译选项标签，并为能力字段补充 numberFormat。

### 展示配置与可读数值

`AnalysisPresentation` 包含 `layout: 'table' | 'metric' | 'bar' | 'line' | 'area' | 'pie'`、必填 `columns: { alias, width? }[]`、可选 x/series/metrics 别名、`orientation: 'vertical' | 'horizontal'`、stacked 和 donut。显式空 metrics 列表无效。`compileAnalysis` 只校验查询配置，schema 按查询顺序返回。`validateAnalysisPresentation(value, schema?)` 独立返回展示校验错误字符串。保存合并两类校验，运行仅校验查询；修改显示方式消费已执行结果，不发起查询。

切换到数据表时保留图表轴、系列、指标选择和显示偏好，切回后恢复。删除输出会清理对应展示引用；最后一个被选指标被删除时恢复默认指标，用户主动清空的选择仍保留为可编辑状态。重新选择有效指标也会移除失效别名。柱状图与面积图将正负 SUM 值分别堆叠在零轴两侧；null 或缺失组合仍回退表格。 仅切换布局不会截断有效指标选择，也不会替换用户主动清空的选择。多指标切换到饼图时保留选择并提示兼容性问题，直到用户明确选定一个支持的指标；直接切回原布局时保留原有选择。 可选默认值在渲染时解析，不反写进草稿，因此单纯往返切换不会把原本未修改的视图标记为待保存。

`projectAnalysis(plan, rows, presentation)` 接收已校验行，返回 `{ plan, issues, points, series, x?, continuous }`。投影 plan 应用列顺序/宽度并追加未指定列。维度、单位或指标语义不兼容时，返回可操作的错误说明并回退表格。指标卡要求未分组结果；折线/面积图要求连续数值或时间轴；饼图要求 SUM 或 COUNT、无 null/负值且没有系列拆分。图表最多 500 个已返回分组、12 个系列、24 个饼图扇区。投影不会重新计算平均值、补造零桶，也不会把截断分组宣称为全量合计。重复显示标签不会合并带类型的组合身份。分析表格使用固定列布局，默认列宽 160px（可由列宽配置覆盖），窄容器横向滚动；文本截断时通过原生 title 保留完整单元格值。`AnalysisTable.sortDisabled` 默认 false；工作输入不能运行时将其设为 true，不把已显示结果误标为加载中。

`formatAnalysisValue(value, column?, timeZone?)` 返回展示文本。分组/ANY 字段的 `options: { value, label }[]` 按值与类型匹配；能力字段和结果列的 numberFormat 为 `Intl.NumberFormatOptions & { locale?: string }`。COUNT 使用精确整数千分位；其他数值默认最多三位小数，绝对值小于 0.001 的非零数最多六位有效数字。默认 locale 为 zh-CN。显式数字选项覆盖默认精度；Intl 设置错误时回退原始值文本。null/undefined 显示为“无值”，零仍为零，日期时间使用计划时区。表格、指标卡、指标提示保留原值 title。格式化不改变查询值、排序或行身份。

`AnalysisEditor` 提供范围筛选、标量 ANY、受限公式编辑及原始数值草稿。React 入口导出 `AnalysisPresentationEditor`，接收 value、可选已执行 plan、onChange、disabled，以及默认 true 的 showIssues。完整分析页由图表结果区统一呈现兼容性提示，避免重复；表格视图和独立编辑器仍保留提示。`AnalysisView` 延迟加载 Recharts 渲染这些图表；查询编辑与展示编辑保持独立。

源码：[analysisCompiler.ts:205](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisCompiler.ts#L205), [wowAnalysis.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/wowAnalysis.ts#L62), [analysisProjection.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisProjection.ts#L106), [analysisFormatting.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/src/analysis/analysisFormatting.ts#L18)。

`AnalysisEditor` 还接收 filterContext、同时包含筛选/分析注册的 extensions，以及报告当前元素筛选编辑器状态的 `onFilterValidityChange(valid)`。`AnalysisView` 在运行/保存前合并根及全部元素编辑器有效性，某个面板有效不会清除另一个面板的无效缓冲。切换范围或实例会释放过期编辑器状态。自定义元素筛选组件可获得与根筛选相同的扩展和宿主上下文。

分析配置采用上方查询构建器、下方全宽结果的布局。维度和指标以横向摘要项展示，点击后在保留状态的浮层内编辑，公式使用更宽的编辑区。新增条目自动打开，无效条目标记为待完善。筛选及高级排序/行数独立折叠；收起整个构建器后显示当前查询摘要。视口小于 768px 或分析容器小于 640px 时使用配置对话框。支持方向键和拖动排序，包括横向换行。

`AnalysisView` 在布局切换、关闭对话框时保留同一编辑子树，包括扩展本地草稿和无效状态。导出的 `DialogContent` 新增可选 `keepMounted`（默认 `false`），转发 Base UI Portal 选项，关闭时保留的内容仍隐藏。饼图/环形图常驻显示数值和已返回分组内占比，使用归一化比例避免溢出，不修改已校验的原始值。

侧栏、实例选择器和管理视图统一使用图标区分分析视图与数据视图，并提供可访问的类型说明。图表与指标结果通过底部居中的“分析 / 数据表”标签切换；切换只影响本地展示，不发起查询或保存，数据表首次打开后保留当前页。图表配置不支持绘制时显示原因并选中数据表，直到配置支持绘图后恢复分析入口。

分析视图与数据视图共用手动刷新、自动刷新（关闭、30 秒、1 分钟、5 分钟）和原地全屏展开交互。页面后台、编辑或使用弹层、查询中、查询失败、保存中以及查询配置尚未运行时，自动刷新暂停，不会自动提交草稿。Esc 退出全屏且不重建编辑器。刷新间隔属于当前挂载视图，卸载时清理定时器。
