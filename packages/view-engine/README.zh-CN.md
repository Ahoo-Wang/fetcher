# Fetcher View Engine

独立的 `@ahoo-wang/fetcher-view-engine` 包，提供可独立使用的 Wow 过滤器编译与校验、完整 `FilterPanel`、结构化值编辑器和 shadcn/Base UI 控件。同时提供不依赖 React 的 ViewEngine 和完整 RecordView 页面，定义、实例与保存接口由宿主管理。卡片、AnalysisView 与 DashboardView 属于后续工作。

## RecordView 数据视图

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import { ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function OrderPage({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  return (
    <ViewPage
      scopeKey={scopeKey}
      definitionId="orders"
      host={host}
      selectable
    />
  );
}
```

`ViewHost` 加载定义及完整实例列表、解析已配置的 Wow 查询客户端、提供权限，并按需实现保存与创建接口。本地数据可直接传入 `definition` 与 `instances: {instances, defaultInstanceId}`。必填 `scopeKey` 标识用户、租户与访问范围，范围变化时更换此值；引擎按 `[scopeKey, definitionId]` 管理生命周期。同一作用域下替换宿主对象会更新回调与能力，保留草稿。本地定义和列表作为该生命周期的初始值，引用变化不触发重载；需要重新初始化时显式改变 React key。宿主自行管理引擎时，使用 `ViewPageContent` 或 `RecordView`。

引擎根据 `filterDraft`、最近一次查询应用的编辑基线 `filterBaseline` 和编辑器报告的有效性 `filterValid` 推导 pending。`setFilterDraft(draft, id?, valid?)` 可原子更新草稿及局部有效性；`setFilterValidity(valid, id?)` 报告输入缓冲区是否有效，传入 true 不能清除尚未查询的草稿修改。查询或撤销使草稿回到已应用基线后才能保存，未设置值的控件也保留在编辑基线中。原 `setFilterPending` setter 已移除。

编辑器报告无效输入时，`applyFilter` 会拒绝执行，重复应用当前条件也不能绕过。先修正输入或撤销修改后再提交；拒绝时保留草稿和当前查询。

核心快照中的定义、实例、草稿和记录采用 `DeepReadonly`。可直接读取，也可将快照传回 `applyFilter`、`setFilterDraft`、`setSort` 和 `setColumns`，引擎会复制接受的输入。修改时构造新对象；传给宿主查询和写入接口的参数仍是独立、可编辑的数据对象。

表格采用 shadcn Table + TanStack Table，支持服务端排序、分页与只向前的游标查询。仅在表头列边缘拖动调整宽度，并保留键盘方向键作为无障碍替代；列设置通过拖动手柄调整同一区域内的顺序，也可聚焦手柄后按上、下方向键移动，同时支持显示/隐藏。松手后写入顺序，取消拖动保持原配置。调整列展示不查询，筛选点击“查询”才生效。页面按实例保留草稿，当前实例不再单独显示“已编辑”标签，由保存按钮表达可保存状态，有待查询筛选时仍阻止保存。另存为支持个人和公共共享实例，实际权限与持久化由宿主负责。

紧凑工作台将标题与全局工具栏合并：按标题、当前实例、保存组合按钮排列，菜单提供另存为与还原，创建等全局操作置于右侧。没有原实例保存权限时，主按钮改为另存为。筛选组合按钮同时提供展开/收起和简单/高级模式选择，省去独立标题行；添加筛选在左，撤销、清空与查询在右。

独立表格工具栏左侧显示已选数量和取消选择，右侧依次为批量操作、列设置。取消选择不查询，也不清空筛选草稿。待查询提示在展开时位于查询附近，收起时位于筛选按钮；当前标题与侧栏不再重复，其他实例仍保留待查询标记。记录统计和分页统一放在底部。筛选区默认展开，收起时编辑器持续挂载，保留草稿与勾选。收起状态不保存到实例，也不触发查询；窄容器内控件自动换行。

未固定、没有枚举选项且未显式设置 `width` 的 string 列均分剩余宽度，从默认 180px 增长到最多 480px；显式列宽、固定列与其他类型保持配置或默认尺寸。窄容器内横向滚动。拖动自动列会保存实际新宽度；列设置不提供宽度输入，定义可省略 width 启用自动适配。容器大小变化不修改实例、不查询。无法分配的空间放在右固定区域之前，操作保持右边缘。数值表头与单元格默认右对齐，使用等宽数字；自定义渲染器可覆盖自身对齐。响应式工作台 Storybook 示例每页展示 15 条记录。

视图列表分为“个人视图”和“公共视图”，系统视图显示“系统”标签。
列表旁及视图切换下拉面板底部的**管理视图**统一提供行内改名、确认删除和组内拖动排序。
名称默认显示为文本，点击编辑图标才显示输入框；保存或取消后恢复文本，Escape 取消当前名称编辑，保存失败保留输入以便重试。
系统视图不能改名或删除，但可调整其个人展示顺序。改名由
`host.renameInstance(id, title, revision?)` 执行，删除由 `deleteInstance(id, revision?)`
执行，宿主通过 `getInstancePermissions` 的 `rename` / `delete` 授权。
改名只保存名称，保留待查询筛选和未保存的列配置，不触发查询。
`saveInstanceOrder(definitionId, ids)` 保存当前用户的展示顺序，包括公共视图；不影响其他用户。
写入成功后更新列表，失败保留编辑并可重试。原保存菜单移除独立删除入口，保留另存为和还原。
无 React 时可调用 `renameInstance(title, id?)`、`deleteInstance(id?)`、
`canReorderInstances()` 和 `reorderInstances(ids)`。

主键列（字段绑定 `definition.rowKey`）始终固定在左侧最前面，操作列始终固定在右侧最后面，实例配置和列设置都不能改变这两类列的固定方向。列设置使用图钉按钮切换固定状态，不提供左/右下拉框：未固定列仅在上下恰有一个相邻设置项已固定时可点击，继承其固定方向；上下均未固定或均已固定时不可固定，已固定的普通列仍可取消固定；主键和操作列显示已固定且禁用的图钉。宿主契约仍接受 `pinned: 'left' | 'right' | false`，已有固定方向在用户修改前保持有效，调整随实例保存；同一区域内可拖动排序，数值汇总选择与显隐、固定控件处于同一行。表头、数据行和汇总行保持对齐，隐藏与调宽同步更新偏移；选择列位于主键之前。调整固定位置和顺序不查询记录或汇总。

`extensions.cells`、`globalActions`、`tableActions`、`rowActions` 与 `filters` 注册任意本地 React 组件，远程定义只保存名称与 JSON 参数。定义通过 `recordActions.global`、`.table`、`.row` 指定创建、批量处理、查看记录等操作所在区域。已有全局注册保留原位置，批量组件需显式移到 `tableActions`。业务操作得到已应用的查询范围、稳定记录主键与绑定当前实例的刷新回调。勾选仅表示明确选择的当前页记录。定义、实例和记录必须是 JSON 数据；主键必须为唯一字符串或有限数字，不回退到数组下标。核心入口仍不加载 React。

扩展输入采用导出的 `DeepReadonly<T>` 递归只读快照。把需要编辑的字段复制到组件自己的表单状态，再通过宿主命令或引擎方法提交。尚未查询的筛选编辑不会触发记录单元格边界的重渲染。

全局和批量操作组件渲染失败后，选择、查询状态等实际输入发生变化时会重新尝试渲染；无关的筛选草稿编辑不会反复触发失败组件。

Storybook 的 **View Engine → Record View** 使用内存服务演示完整请求与回包。详见[宿主与扩展契约](../../skills/fetcher-view-engine/references/api.md#record-views-and-host-contract)。

另存为的“可见范围”使用 Radio：个人视图仅自己可见，公共视图对有访问权限的用户可见。两项均直接展示说明；无创建权限的范围禁用，默认选中有权限的范围。

当固定区域让业务字段不足 128px 时，表格临时采用紧凑布局：主键缩窄并通过 Tooltip 显示完整值，操作列使用 64px 图标弹层，普通固定列暂随中间区域滚动。容器恢复后还原原列宽与固定偏好，不写入实例；紧凑模式的主键/操作列自动定宽，在常规布局中可拖动调宽。极窄容器或固定锚点过多时明确提示空间不足。

查询失败在记录区展示图标、原因与重试，不使用空结果图标，不显示零条记录或分页。后台失败保留原记录，并标明上次查询结果。筛选组合按钮显示已应用条件数量，Tooltip 保留原逻辑分组和阈值；待查询草稿不会替换已应用摘要。自动刷新暂停时提供原因和恢复条件。普通保存成功后短暂显示“已保存”及无障碍播报。

### 本页 / 所有汇总

计算、查询构建与结果解析函数接收独立的 `RecordSummaryMetric[]`，每项为 `{ id, field, function }`。使用 `getRecordSummaryMetrics(instance.config.presentation)` 将表格实例转换为指标，查询计算不再依赖列宽、固定位置等展示属性。`ViewInstanceMetadata`、`RecordQueryConfig` 与 `RecordTablePresentation` 分别描述通用实例元数据、记录查询与表格展示。

只有明确声明为 `type: 'number'` 的字段支持汇总，字段列通过 `summary: ['SUM', 'AVG', 'MIN', 'MAX']` 多选合计、平均值、最小值和最大值；取消全部选择即不汇总，省略或空数组均表示关闭。列设置仅为数值字段提供汇总入口，不支持 COUNT 记录数汇总。`field.summaryFunctions` 可限制可用方式，`[]` 可关闭汇总；列汇总方式随实例保存。

表格底部同时显示“本页”和“所有”两行，范围标签在左侧各显示一次，列内按合计、平均值、最小值、最大值的固定顺序展示已选指标，标签左对齐、数字右对齐且保持单行。加载时记录区居中显示 Spin，本页与所有范围标签旁各显示一个 Spin；待加载指标保留空位，分页不重复显示加载文字。本页直接计算已加载记录，所有通过宿主 Wow 查询客户端的 `aggregate` 按已查询条件跨页统计，不拉取全部明细。未提交的筛选修改与行勾选不影响统计范围；所有汇总的加载或失败不影响本页数值和业务记录，并支持独立重试。修改汇总方式会同步更新两行，不重新查询列表。

每个失败范围仅在标签旁显示一个错误图标，点击展开原因；“所有”的详情中提供“重试汇总”，只重新请求聚合。本页错误仅展示本页原因，指标保留“—”占位，表格底部不再额外显示通栏错误提示。

数值字段可配置 `numberFormat`（`Intl.NumberFormatOptions` 加可选的 `locale`，默认 `zh-CN`）。金额使用 `{ style: 'currency', currency: 'CNY' }`，整数使用 `{ maximumFractionDigits: 0 }`。普通数字未配置精度时默认最多两位小数，其他样式遵循 Intl 默认值。默认数据单元格与汇总共用该配置，自定义单元格可调用 `formatRecordNumber(value, field)`；原始记录与汇总值保持不变。悬停或键盘聚焦汇总值可通过 Tooltip 查看完整原值。

数值汇总忽略空值和缺失值；空集结果为 null，显示“—”，与零区分。不使用 React 时，可独立调用 `calculateRecordSummary`、`createRecordSummaryQuery`、`readRecordSummaryResult`，或使用引擎 `refreshSummary` 及会话 `pageSummary` / `allSummary`。结果按列 ID 和函数索引，例如 `values.amount.SUM`；所有列合计最多 64 个指标。Storybook 提供多选汇总、失败重试和空集场景。

### 自动刷新与页面展开

顶部全局工具栏提供刷新组合按钮和页面展开按钮。自动刷新默认关闭，可选择 30 秒 / 1 分钟 / 5 分钟。
后台请求成功前保留现有记录，不重叠请求；待查询筛选、已选记录、写入操作、
错误、隐藏页面、正在编辑或使用弹层时暂停，游标查询第二页起也暂停。
所有汇总完成后才开始下一次后台读取；刷新失败保留记录，等待手动重试。
宿主业务操作期间可向 `ViewPage`、`ViewPageContent` 或 `RecordView` 传入
`autoRefreshPaused`。切换实例后自动刷新恢复关闭。

刷新按钮显示所选周期及 `分:秒` 倒计时（例如 `30 秒 · 00:29`），按实际截止时间
计算。暂停时显示“已暂停”，请求期间显示“刷新中”；恢复、切换周期或刷新完成后
重新开始完整周期。倒计时不会每秒触发读屏播报。

无 React 时可调用 `engine.refresh(id, {background: true})`，通过
`session.refreshing` 观察后台读取状态。引擎负责查询、选择和写入保护，
React 控件额外管理定时器、页面可见性与编辑焦点。

展开占满当前页面，保留浏览器标签、筛选、勾选和分页。Esc 优先关闭当前弹层，
再次按下收起视图，也可点击工具栏收起；在 iframe 中展开范围为当前 frame。
这些显示偏好不随实例保存。Storybook 的“自动刷新与页面展开”演示两个控件。

## FilterPanel

```tsx
import { useState } from 'react';
import { filter, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import type { FilterFieldDefinition } from '@ahoo-wang/fetcher-view-engine';
import { FilterPanel } from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

const fields: FilterFieldDefinition[] = [
  { field: 'amount', label: 'Amount', type: 'number' },
  { field: 'status', label: 'Status', type: 'string' },
];

export function OrderFilters({
  onQuery,
}: {
  onQuery: (expression: FilterExpression) => void;
}) {
  const [value, setValue] = useState<FilterExpression>(filter.matchAll());
  return (
    <FilterPanel
      fields={fields}
      value={value}
      onApply={next => {
        setValue(next);
        onQuery(next);
      }}
    />
  );
}
```

简单模式隐含 AND，高级模式结构化编辑全部 50 种 Wow 操作以及 AND / OR / NOR / ELEMENT_MATCH。编辑、清空、撤销、模式切换都不请求服务；点击查询后通过 `onApply` 提交合法条件。宿主同步更新 `value` 并管理请求，通过 `querying` / `queryError` 传回状态。`onPendingChange` 用于保存视图前的待查询保护。

简单模式中每个字段只保留一项，未设置值也占用该字段。高级模式的 AND、OR、NOR 均允许同一字段多条规则，元素作用域内同样适用；编译与实例保存接受合法的重复字段条件。包含重复字段的草稿保持高级模式，删除多余条件且结构可平铺后才允许切回简单模式。

点击“添加筛选”打开锚定按钮的 Popover，按组展示 Checkbox，打开和关闭不改变表格、查询按钮的位置。浮层限制高度，字段区内部滚动；添加后保持打开，支持连续添加。“完成”或 Esc 关闭并返回触发按钮焦点，点击外部也可关闭。字段定义可通过 `group` 指定分组，按定义中的首次出现顺序展示。与有分组字段混用时，未分组字段显示在“其他字段”下；复选框与当前分组的草稿同步：勾选添加条件，取消勾选移除该字段的直接条件，未设置值仍显示为已勾选。高级模式在已选字段旁显示条件数量和“追加条件”加号，AND、OR、NOR 统一支持追加；高级模式在“添加筛选”旁提供图标下拉按钮，独立选择 AND/OR/NOR 并添加到当前分组，这三项不进入字段面板；未获定义允许的操作禁用。根级操作仍保留添加按钮。所有变更仍在点击“查询”后统一生效。

完全未设置的值保留控件但不产生谓词；部分填写、无效数据和未注册扩展阻止查询。所有字段在添加时绑定，保留所属分组及作用域。`extensions.filters` 提供本地自定义编辑器；`draft` / `onDraftChange` 可将内置编辑缓冲交由宿主按实例保存。自定义组件自己的临时 UI 状态应由宿主上下文保存或保持挂载。

简单模式没有条件操作菜单或前后排序。高级模式支持新增、删除和编辑分组，不提供条件或分组的移动功能；内置标量筛选项移除“清空”和“特殊值”按钮；删除输入内容可保留未设置值，空值和空字符串使用对应操作符。编辑已有日期时间会保留夏令时重复小时的原偏移，跨季节日期仍使用目标日期的实际偏移。

自定义筛选器可使用任意 React 组件。注册 `render: 'value'`（默认）替换值区域，或用 `render: 'filter'` 与 `FilterComponentProps` 接管完整非容器 UI。面板继续负责字段与能力校验、错误展示，以及点击查询后统一生效。

组合布局可用 `FilterPanel.renderToolbar` 替换默认标题，接收 `FilterPanelToolbarProps`：`panelId`、`mode`、`options`、`pending`、`disabled`、`onModeChange`。使用面板提供的回调与禁用选项，嵌套或未完善的高级条件不能切回简单模式。`collapsed` 仅隐藏内容并保留编辑器；`RecordView.toolbarStart` 可插入全局工具栏左侧内容，`ViewPage` 在此提供保存、标题与实例选择。

## 单个控件

```tsx
import { useState } from 'react';
import {
  FieldFilter,
  InputGroupInput,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

export function AmountFilter() {
  const [operator, setOperator] = useState('GTE');
  return (
    <FieldFilter
      field={{ field: 'state.amount', label: '订单金额' }}
      operator={operator}
      operators={[
        { value: 'EQ', label: '等于' },
        { value: 'GTE', label: '大于等于' },
      ]}
      onOperatorChange={setOperator}
    >
      <InputGroupInput
        aria-label="订单金额值"
        type="number"
        defaultValue="1000"
      />
    </FieldFilter>
  );
}
```

字段名固定显示，值编辑器由 `children` 提供。操作选择只调用 `onOperatorChange`；输入校验、待查询缓冲、执行查询和保存视图由宿主管理。`FilterSelect` 也可用于受控枚举值、添加字段及逻辑组合方式。传入 `onClear={() => setValue(null)}` 即可提供“清空选择”；必选操作选择器不传此回调。

`FilterSearchSelect` 使用 Base UI Combobox 提供下拉内置搜索，沿用 `FilterSelect` 属性并增加 `searchPlaceholder` / `emptyText`。输入只筛选本地候选，选择和清空仅更新编辑缓冲。Storybook 的“自定义筛选器 · 内置搜索 Select”提供完整客户选择器注册示例。

## 入口与主题

- 核心入口导出字段与草稿契约、过滤器编译校验函数，不加载 React、DOM 或 CSS。
- `/react` 导出 `FilterPanel`、`FilterValueEditor`、单个过滤器控件及组合组件。
- `/styles.css` 是已编译且带前缀的独立样式，宿主无需安装 Tailwind。使用 `/react` 时需要 React 19。

样式沿用 shadcn base-nova 的默认 Neutral 主题。工具类使用 `fve:` 前缀，主题变量使用 `--fve-*`。宿主可用 `.fve-root` 包裹组件并覆盖变量，通过 `data-theme="light"` 或 `data-theme="dark"` 显式指定外观；未指定时通过 `light-dark()` 跟随继承的 CSS `color-scheme`。

Select、下拉菜单与 Popover 面板默认 Portal 到 body，避免被有裁剪或滚动的祖先容器遮住。每次打开（包括受控 `open` 变化）时，将所属范围当前的主题变量、颜色模式和字体传到弹层。宿主需要其他 Select 挂载位置时可显式指定 `SelectContent.container`。

`FilterDatePicker` 使用中文 shadcn Calendar，受控值为 `Date | undefined`。`FilterTimeInput` 组合文本输入与时、分、秒 Select，保留未完成输入及最多九位小数秒。两者均支持 `inline`，可放入 `FieldFilter`。时区转换、存储精度和查询生效时机由宿主管理。未设置值合法：保留编辑器，点击查询时不生成需要值的对应谓词；没有剩余条件时使用 `filter.matchAll()`。日期和时间均为空才算未设置，只填一项时提示补全；时间下拉保留其他已填写片段。已填写但格式错误时仍提示错误；无需值的操作与显式 null / 零 / false 保留 Wow 语义。

## 开发

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine build
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm storybook
```

在 Storybook 中打开 **View Engine → Filter Panel**，体验业务筛选、嵌套元素条件、自定义编辑器校验、查询重试、深色主题与 50 种操作。**View Engine → Date and Time** 提供单独日期时间控件。示例包括手动查询的字段组合、日期选择、精确时间、未完成输入、未设置值和深色主题；**View Engine → Filter Select** 演示选择、清空和重新选择；Controls 支持切换外观与禁用状态。组合示例使用浏览器本地时区生成毫秒时间戳的 Wow 表达式，不请求业务服务。这些示例消费包的公开构建产物，修改包源码后需重新构建。

详见 [API 参考](../../skills/fetcher-view-engine/references/api.md) 与 [第三方许可说明](THIRD_PARTY_NOTICES.md)。
