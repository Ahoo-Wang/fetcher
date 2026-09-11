---
next: false
title: 接入业务扩展
description: 注册业务渲染器、组合记录视图区域并选择局部 CSS 主题。
---

# 接入业务扩展

## 注册式业务扩展

| 需求               | 注册位置                    | 配置引用                                                 |
| ------------------ | --------------------------- | -------------------------------------------------------- |
| 全局业务操作       | `extensions.globalActions`  | `definition.record.recordActions.global`                 |
| 批处理 / 表格操作  | `extensions.toolbarActions` | `definition.record.recordActions.toolbar`                |
| 单行操作           | `extensions.rowActions`     | `definition.record.recordActions.row`，并提供 actions 列 |
| 筛选组件与编译逻辑 | `extensions.filters`        | 字段、操作符或组件配置的编辑器引用                       |
| 自定义单元格       | `extensions.cells`          | `field.cellRenderer` 或 `column.renderer`                |

引用统一为 `{ name, options? }`，options 只能包含 JSON 数据。组件、服务客户端和回调注册在运行时 extensions 中，不能写入保存的 JSON。未知名称和无效配置会显式报错。优先使用已有内置组件。

操作组件收到只读 definition/instance、已应用 `filter`、`sort`、options 和绑定到实例的 `refresh()`。全局/表格操作还收到 `selectedRowKeys` 与 `querying`，行操作收到 `record` 与 `rowKey`。已应用 filter 为 null 表示查询范围不可用。业务应用负责执行写入、处理错误和防止重复提交；写入成功后刷新绑定实例。如果刷新失败，只重试刷新。

一份 `FilterRegistration` 包含组件、纯 `compile(props, context)`、支持的 `modes`，以及可选 `supports` / `clear`。`onChange` 只发布可序列化 props，不直接查询；未完成输入通过 `onValidityChange(false, message)` 报告。筛选注册必须在创建引擎或挂载 `ViewPage` 前准备好；更新同一页面的 props 不能向该引擎补注册。异步注册加载完成后再挂载。重新挂载会重置会话，不是无损热更新机制。单元格和操作渲染器继续沿用现有更新行为。

## 主题与记录视图区域

始终导入 `styles.css`，其中包含组件 CSS 与默认 Neutral 外观。导入 `themes/neutral.css`、`blue.css`、`violet.css`、`green.css`、`orange.css` 或 `shadcn.css` 只会让主题可用；必须通过 `data-fve-theme` 或 `ViewTheme.theme` 选择。导入顺序不会选择主题，不同 `.fve-root` 可同时选择不同主题。

`ViewTheme` 是 `/react` 提供的可选包装。`theme?: string` 接受内置或任意用户主题名；`appearance` 接受 `light`、`dark` 或 `system`；`density` 接受 `comfortable` 或 `compact`。省略时继承。`ViewThemeStyle` 接受 React CSS 属性以及有类型的 `--fve-*` 行内变量。CSS 仍是基础接口。

`ViewPage`、`ViewPageContent` 与 `RecordView` 支持 `renderToolbar` 和 `renderPagination`。只读上下文提供 `defaultContent`、相关状态以及绑定实例的受控操作。返回 `defaultContent` 可保留默认区域，包裹它可追加 UI，返回 `null` 可隐藏区域；默认节点最多渲染一次。回调是渲染函数，需要 Hook 或局部状态时应返回自有组件。库按区域隔离渲染错误；事件处理与异步操作错误仍由应用处理。

稳定样式钩子为 `data-slot="record-view"`、`record-global-toolbar`、`record-toolbar`、`record-applied-filters` 与 `record-pagination`。内部 DOM 层级和工具类可能变化。完整全局工具栏继续固定，因为它负责刷新与展开生命周期。

## 四个可复制示例

### 1. 内置主题

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import {
  useViewEngine,
  ViewPage,
  ViewTheme,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import '@ahoo-wang/fetcher-view-engine/themes/blue.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ host, scopeKey, definitionId: 'orders' });
  return (
    <ViewTheme theme="blue" appearance="system" density="compact">
      <ViewPage {...binding} />
    </ViewTheme>
  );
}
```

### 2. 用户 CSS 主题

```css
/* brand.css */
.fve-root[data-fve-theme='brand'] {
  --fve-primary: light-dark(#1d4ed8, #93c5fd);
  --fve-primary-foreground: light-dark(#ffffff, #172554);
  --fve-ring: light-dark(#1d4ed8, #93c5fd);
  --fve-radius: 0.5rem;
}
```

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import {
  useViewEngine,
  ViewPage,
  ViewTheme,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import './brand.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ host, scopeKey, definitionId: 'orders' });
  return (
    <ViewTheme
      theme="brand"
      style={{ '--fve-font-size': '14px', '--fve-control-height': '2.25em' }}
    >
      <ViewPage {...binding} />
    </ViewTheme>
  );
}
```

部分主题可继承未声明变量。前景/背景颜色应配套定义；库不会自动推导可读的用户颜色。`--fve-font-size` 只使用 `px` 或 `rem`；`em` 与 `%` 会在语义字号中重复放大。其他尺寸变量可使用相对于有效字号的 `em`。

### 3. 宿主 shadcn 映射

```tsx
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import {
  useViewEngine,
  ViewPage,
  ViewTheme,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';
import '@ahoo-wang/fetcher-view-engine/themes/shadcn.css';

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ host, scopeKey, definitionId: 'orders' });
  return (
    <ViewTheme theme="shadcn">
      <ViewPage {...binding} />
    </ViewTheme>
  );
}
```

宿主应提供 `oklch(...)`、`hsl(...)` 或 `#hex` 等完整 CSS 颜色，不解析裸 HSL 通道。缺失 token 使用库默认值；已存在但无效或循环的 token 遵循 CSS 的无效值行为。宿主 ThemeProvider 负责持久化与 `.dark`。宿主只暴露深色值时，局部 light 作用域无法还原浅色 token。

### 4. 有局部状态的表格工具栏区域

```tsx
import { useState } from 'react';
import type { ViewHost } from '@ahoo-wang/fetcher-view-engine';
import {
  useViewEngine,
  ViewPage,
  type RecordToolbarRenderContext,
} from '@ahoo-wang/fetcher-view-engine/react';
import '@ahoo-wang/fetcher-view-engine/styles.css';

function OrdersToolbar({ context }: { context: RecordToolbarRenderContext }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {context.defaultContent}
      <button type="button" onClick={() => setShowHelp(value => !value)}>
        {showHelp ? '隐藏帮助' : '显示帮助'}
      </button>
      {showHelp && <span>已选 {context.selectedRowKeys.length} 项</span>}
    </>
  );
}

export function Orders({
  host,
  scopeKey,
}: {
  host: ViewHost;
  scopeKey: string;
}) {
  const binding = useViewEngine({ host, scopeKey, definitionId: 'orders' });
  return (
    <ViewPage
      {...binding}
      selectable
      renderToolbar={context => <OrdersToolbar context={context} />}
    />
  );
}
```

工具栏上下文还提供 `definition`、`session`、`appliedFilter`、`querying`、`clearSelection()`、`setColumns()` 与 `refresh()`。分页上下文提供 `mode`、分页状态、可用性标记及返回 Promise 的翻页操作。操作会重新检查当前引擎守卫，并始终绑定产生回调时的实例。

## CSS 与 Portal 限制

未知或未加载的主题不会抛错，页面按 CSS 继承/默认值继续显示；这不代表主题文件已经加载。用户在同一主题根节点的 CSS 可以覆盖低优先级库值，无需 `!important`，但同名主题与嵌套显式值仍遵循普通 CSS 级联规则。

库 Portal 会复制已计算的公开颜色、排版、密度与有效外观。变量主题可跨 body Portal，`.brand [data-slot=...]` 一类结构选择器不可跨越。主题/密度属性、class、行内变量及系统偏好变化会更新打开的 Portal；没有伴随这些变化的任意 CSSOM 样式表替换不在监听范围。第三方 Portal 需要采用其自己的主题容器机制。

CSS 自定义属性别名在继承前解析。派生值应定义在目标主题边界，不能依赖子作用域覆盖后重新计算继承的别名。移除局部变量或主题属性后会回到父级/默认作用域。组件契约见 [组件参考](../../reference/view-engine/components.md)，所有支持变量见包的[公开 API 表](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-view-engine/references/api.md)。

### 自定义卡片内容

在 `ViewPage`、`ViewPageContent`、`RecordView` 或 `RecordCardList` 上使用 `renderCard` 替换单张卡片内容。回调接收只读 record、rowKey、definition、instance、index、selected、defaultContent，以及绑定当前实例的 refresh。返回自有组件可自由安排信息结构，包裹 defaultContent 则保留配置字段。选择、网格、分页和错误隔离仍由库管理。回调不持久化；默认卡片设置仅影响 defaultContent。

```tsx
<ViewPage
  {...pageProps}
  renderCard={({ record, rowKey, selected }) => (
    <article>
      <h2>{String(rowKey)}</h2>
      <p>{String(record.amount)}</p>
      {selected && <span>已选择</span>}
    </article>
  )}
/>
```

展示方式切换统一放在顶部全局工具栏，通过显示当前模式名称的下拉框操作，所有宽度保持一致。记录工具栏保留批量操作和布局设置。

卡片预览包含实际的本地订单操作：查看详情、处理单笔订单、批量处理已选订单和创建订单。默认卡片与自定义卡片复用同一行操作组件。处理会修改数据并刷新当前队列，失败反馈和重试沿用已有订单操作 Provider。示例业务数据在刷新页面后重置，可持久化示例独立保存视图配置。

提供 `renderCard` 时，RecordView/ViewPage 隐藏内置卡片设置；需要业务配置时通过现有 `renderToolbar` 和 `setCardConfig` 提供。包裹 `defaultContent` 的自定义渲染也遵循此规则，表格列设置不受影响。

卡片 Storybook 使用 12 件家居与出行商品、本地 SVG 封面、详情、收藏及单个/批量上下架，默认卡片、自定义卡片、窄屏深色和保存视图共用同一数据源。原订单业务回归独立保留。
