---
title: '工具栏、刷新与本地化'
description: '工具栏、刷新与本地化 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 工具栏、刷新与本地化

TopBar 组合视图操作、过滤/面板开关、行密度、刷新、监控、分享、全屏。props 包含 activeView/views/viewerDefinitionId、选中记录、mutation 回调。按钮调用应用回调，保存不是隐式 localStorage 操作。

| API                 | 行为 / 默认值                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| RefreshDataBarItem  | 向定义作用域刷新总线发布，没有额外公开 onClick prop。                                                         |
| AutoRefreshBarItem  | 要求 viewId/viewerDefinitionId，默认 1/3/5 分钟及从不（0），选择按 view 保存到 view:refresh，无选择默认从不。 |
| FilterBarItem       | defaultShowFilter 初始化并同步本地 active，onChange 收到切换后的 boolean。                                    |
| ColumnHeightBarItem | defaultTableSize/onChange 控制密度选择。                                                                      |
| DataMonitorBarItem  | 委托 React useDataMonitor，count 轮询与 refresh 发布互相独立。                                                |
| FullscreenBarItem   | 读取 React 全屏 context，provider 外不渲染。                                                                  |
| ShareLinkBarItem    | 复制 window.location.href，剪贴板失败显示错误，不序列化当前过滤状态。                                         |
| BarItem / Point     | 展示图标 active 标记/分隔点，无独立数据逻辑。                                                                 |

`useRefreshDataEventBus(subscriberId?)` 未传作用域时使用 React useId；返回 bus、publish(overrideId?): Promise&lt;void&gt;、subscribe(handler,overrideId?): boolean。处理器名加目标 subscriber ID 前缀，并按 ID 过滤投递。卸载/作用域变化只移除当前 Hook 注册的处理器，共享总线继续存在。用 definition ID 可协调 Viewer/刷新控件；相同最终处理器名称可能注册失败，不自动补唯一后缀。AutoRefresh 在变化/卸载时清除定时器，定时回调可能重叠，不串行化网络请求。

`useLocale()` 返回局部 React locale 状态和 setLocale，默认中文。setLocale 只将已定义顶层键浅合并到默认值，部分嵌套对象会整体替换对应节。它不是全局 LocaleProvider，修改一个 Hook 不会同步全部组件。Locale 只声明当前支持的文案，许多控件仍包含中文硬编码/回退，不能宣称通过此 Hook 实现全站英文切换。OPERATOR_zh_CN 是单独的过滤操作符标签映射。Locale 和生成线上字段不改变服务端语言或查询行为。

## 完整示例

```tsx
import { useEffect } from 'react';
import { useRefreshDataEventBus } from '@ahoo-wang/fetcher-viewer';
export function Refresh({ reload }: { reload: () => Promise<void> }) {
  const { subscribe, publish } = useRefreshDataEventBus('users');
  useEffect(() => {
    subscribe({ name: 'reload-users', handle: reload });
  }, [subscribe, reload]);
  return (
    <button
      onClick={() => {
        void publish().catch(console.error);
      }}
    >
      Refresh users
    </button>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useRefreshDataEventBus {#api-useRefreshDataEventBus}

```ts
export function useRefreshDataEventBus(
  subscriberId?: string,
): RefreshDataEventBusReturn;
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L29)

### RefreshDataEvent {#api-RefreshDataEvent}

```ts
export interface RefreshDataEvent {
  type: 'REFRESH';
  subscriberId: string;
}
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L10)

### RefreshDataEventBusReturn {#api-RefreshDataEventBusReturn}

```ts
export interface RefreshDataEventBusReturn {
  bus: BroadcastTypedEventBus<RefreshDataEvent>;
  publish: (subscriberId?: string) => Promise<void>;
  subscribe: (
    handler: EventHandler<RefreshDataEvent>,
    subscriberId?: string,
  ) => boolean;
}
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L15)

### AutoRefreshBarItem {#api-AutoRefreshBarItem}

```ts
export function AutoRefreshBarItem(
  options: AutoRefreshBarItemProps,
): import('react').JSX.Element;
```

实现默认值: `items = DefaultAutoRefreshItems`.

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L52)

### AutoRefreshItem {#api-AutoRefreshItem}

```ts
export interface AutoRefreshItem {
  label: string;
  key: string;
  refreshInterval: number;
}
```

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L9)

### AutoRefreshBarItemProps {#api-AutoRefreshBarItemProps}

```ts
export interface AutoRefreshBarItemProps {
  items?: AutoRefreshItem[];
  viewId: string;
  viewerDefinitionId: string;
}
```

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L15)

### BarItem {#api-BarItem}

```ts
export function BarItem(props: BarItemProps): React.JSX.Element;
```

[packages/viewer/src/topbar/BarItem.tsx:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/BarItem.tsx#L9)

### BarItemProps {#api-BarItemProps}

```ts
export interface BarItemProps {
  icon: React.ReactNode;
  active: boolean;
}
```

[packages/viewer/src/topbar/BarItem.tsx:4](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/BarItem.tsx#L4)

### ColumnHeightBarItem {#api-ColumnHeightBarItem}

```ts
export function ColumnHeightBarItem(
  props: ColumnHeightBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/ColumnHeightBarItem.tsx:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ColumnHeightBarItem.tsx#L15)

### ColumnHeightBarItemProps {#api-ColumnHeightBarItemProps}

```ts
export interface ColumnHeightBarItemProps extends TopBarItemProps {
  defaultTableSize: SizeType;
  onChange?: (size: SizeType) => void;
}
```

[packages/viewer/src/topbar/ColumnHeightBarItem.tsx:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ColumnHeightBarItem.tsx#L10)

### DataMonitorBarItem {#api-DataMonitorBarItem}

```ts
export function DataMonitorBarItem(
  props: DataMonitorBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/DataMonitorBarItem.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/DataMonitorBarItem.tsx#L20)

### DataMonitorBarItemProps {#api-DataMonitorBarItemProps}

```ts
export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}
```

[packages/viewer/src/topbar/DataMonitorBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/DataMonitorBarItem.tsx#L11)

### FilterBarItem {#api-FilterBarItem}

```ts
export function FilterBarItem(
  props: FilterBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/FilterBarItem.tsx:12](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FilterBarItem.tsx#L12)

### FilterBarItemProps {#api-FilterBarItemProps}

```ts
export interface FilterBarItemProps extends TopBarItemProps {
  defaultShowFilter: boolean;
  onChange?: (show: boolean) => void;
}
```

[packages/viewer/src/topbar/FilterBarItem.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FilterBarItem.tsx#L7)

### FullscreenBarItem {#api-FullscreenBarItem}

```ts
export function FullscreenBarItem(
  props: FullscreenBarItemProps,
): import('react').JSX.Element | null;
```

[packages/viewer/src/topbar/FullscreenBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FullscreenBarItem.tsx#L11)

### FullscreenBarItemProps {#api-FullscreenBarItemProps}

```ts
export interface FullscreenBarItemProps
  extends UseFullscreenOptions, TopBarItemProps {}
```

[packages/viewer/src/topbar/FullscreenBarItem.tsx:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FullscreenBarItem.tsx#L8)

### Point {#api-Point}

```ts
export function Point(): import('react').JSX.Element;
```

[packages/viewer/src/topbar/Point.tsx:1](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/Point.tsx#L1)

### RefreshDataBarItem {#api-RefreshDataBarItem}

```ts
export function RefreshDataBarItem(
  props: RefreshDataBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/RefreshDataBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/RefreshDataBarItem.tsx#L11)

### RefreshDataBarItemProps {#api-RefreshDataBarItemProps}

```ts
export interface RefreshDataBarItemProps extends TopBarItemProps {
  viewerDefinitionId?: string;
}
```

[packages/viewer/src/topbar/RefreshDataBarItem.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/RefreshDataBarItem.tsx#L7)

### ShareLinkBarItem {#api-ShareLinkBarItem}

```ts
export function ShareLinkBarItem(
  props: ShareLinkBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/ShareLinkBarItem.tsx:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ShareLinkBarItem.tsx#L8)

### ShareLinkBarItemProps {#api-ShareLinkBarItemProps}

```ts
export interface ShareLinkBarItemProps extends TopBarItemProps {}
```

[packages/viewer/src/topbar/ShareLinkBarItem.tsx:6](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ShareLinkBarItem.tsx#L6)

### TopBar {#api-TopBar}

```ts
export function TopBar<RecordType>(
  props: TopBarProps<RecordType>,
): React.JSX.Element;
```

[packages/viewer/src/topbar/TopBar.tsx:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/TopBar.tsx#L107)

### TopBarProps {#api-TopBarProps}

::: details 展开完整字段与成员

```ts
export interface TopBarProps<
  RecordType,
> extends TopbarActionsCapable<RecordType> {
  title: string;
  viewerDefinitionId: string;
  activeView: ViewState;
  views: ViewState[];
  viewChanged: boolean;
  onReset?: () => void;
  tableSelectedItems: RecordType[];
  showViewPanel: boolean;
  onShowViewPanelChange?: (showViewPanel: boolean) => void;
  showFilter: boolean;
  onShowFilterChange?: (show: boolean) => void;
  defaultTableSize: SizeType;
  onTableSizeChange?: (size: SizeType) => void;
  onCreateView: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView: (view: ViewState, onSuccess?: () => void) => void;
  onDeleteView: (view: ViewState, onSuccess?: () => void) => void;
  fullscreenTarget?: RefObject<HTMLElement | null>;
  dataMonitorProps?: {
    viewId: string;
    countUrl: string;
    viewName: string;
    condition: Condition;
    notification: DataMonitorNotificationConfig;
  };
}
```

:::

[packages/viewer/src/topbar/TopBar.tsx:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/TopBar.tsx#L35)

### TopBarItemProps {#api-TopBarItemProps}

```ts
export interface TopBarItemProps extends StyleCapable {}
```

[packages/viewer/src/topbar/types.ts:3](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/types.ts#L3)

### Locale {#api-Locale}

::: details 展开完整字段与成员

```ts
export interface Locale {
  personalView?: string;
  sharedView?: string;
  view?: {
    viewName?: string;
    viewType?: {
      name?: string;
      personal?: string;
      shared?: string;
    };
  };
  filterPanel?: {
    addFilterTitle?: string;
    searchButtonTitle?: string;
  };
  topBar?: {
    tableSize?: {
      middle?: string;
      small?: string;
    };
    autoRefresh?: {
      title?: string;
    };
  };
  selectedCountLabel?: string;
  createViewMethod?: {
    create?: string;
    saveAs?: string;
  };
  viewPanel?: {
    saveButton?: string;
    cancelButton?: string;
  };
}
```

:::

[packages/viewer/src/locale/Locale.ts:1](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/Locale.ts#L1)

### useLocale {#api-useLocale}

```ts
export function useLocale(): UseLocaleReturn;
```

[packages/viewer/src/locale/useLocale.ts:12](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/useLocale.ts#L12)

### UseLocaleReturn {#api-UseLocaleReturn}

```ts
export interface UseLocaleReturn {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
```

[packages/viewer/src/locale/useLocale.ts:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/useLocale.ts#L7)

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs)
